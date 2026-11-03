// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
// Electron utility process entry point.
// Receives MessagePorts from the main process via process.parentPort.
// Each port can send any type of work message (loadFile, saveFile,
// exportFile, executeCommand) and receives its response on the same port.
import type AdmZip from 'adm-zip';

import {
  type ExportType,
  MergeOpossumFilesErrorType,
  type MergeOpossumFilesResult,
} from '../../shared/shared-types';
import {
  type CommandName,
  type CommandParams,
  type CommandReturn,
  executeCommand,
  isMutationCommand,
} from '../api/commands';
import { exportFile } from '../api/exportCommands';
import { forceUnlockOpossumFile } from '../api/forceUnlock';
import {
  mergeOpossumFiles,
  mergeOpossumFilesFromPaths,
} from '../api/mergeOpossumFiles';
import { saveFile } from '../api/saveFile';
import { splitOpossumFile } from '../api/splitOpossumFile';
import {
  loadFile,
  type LoadFileIpcResult,
  type LoadFileProgressCallback,
} from '../input/loadFile';

interface LoadFileMessage {
  type: 'loadFile';
  filePath: string;
}

interface SaveFileMessage {
  type: 'saveFile';
  projectId: string;
  opossumFilePath: string;
}

interface ForceUnlockMessage {
  type: 'forceUnlock';
  projectId: string;
  opossumFilePath: string;
}

interface SplitOpossumFileMessage {
  type: 'splitOpossumFile';
  projectId: string;
  opossumFilePath: string;
  selectedFolderPaths: Array<string>;
  splitOpossumFilePath: string;
}

interface MergeOpossumFilesMessage {
  ignoreReadonlyResourceOutputConflicts: boolean;
  type: 'mergeOpossumFiles';
  projectId: string;
  inputFileChecksum?: string;
  opossumFilePath: string;
  partitionPaths: Array<string>;
}

interface MergeOpossumFilesFromPathsMessage {
  ignoreReadonlyResourceOutputConflicts: boolean;
  inputPaths: Array<string>;
  outputPath: string;
  type: 'mergeOpossumFilesFromPaths';
}

interface ExportFileMessage {
  type: 'exportFile';
  exportType: ExportType;
  filePath: string;
}

interface ExecuteCommandMessage {
  type: 'executeCommand';
  command: CommandName;
  params: CommandParams<CommandName>;
}

interface WhenIdleMessage {
  type: 'whenIdle';
}

export type DbProcessPayload =
  | LoadFileMessage
  | SaveFileMessage
  | ForceUnlockMessage
  | SplitOpossumFileMessage
  | MergeOpossumFilesMessage
  | MergeOpossumFilesFromPathsMessage
  | ExportFileMessage
  | ExecuteCommandMessage
  | WhenIdleMessage;

export type DbProcessRequest = DbProcessPayload & { id: number };

type SuccessPayload =
  | LoadFileIpcResult
  | Awaited<CommandReturn<CommandName>>
  | MergeOpossumFilesResult
  | boolean
  | undefined;

interface SuccessResponse {
  id: number;
  type: 'success';
  result: SuccessPayload;
}

interface ErrorResponse {
  id: number;
  type: 'error';
  error: string;
  stack?: string;
}

interface ProgressResponse {
  id: number;
  type: 'progress';
  message: string;
  level?: 'info' | 'warn';
}

export type DbProcessResponse =
  SuccessResponse | ErrorResponse | ProgressResponse;

type ResponsePort = {
  postMessage(message: DbProcessResponse): void;
};

let storedOpossumZip: AdmZip | undefined;
let saveTarget: { projectId: string; opossumFilePath: string } | undefined;

// Every mutating command registers here when it starts executing and stays
// registered until its file write has concluded. The `whenIdle` message
// resolves only when the registry is empty, so a waiter can rely on having
// every mutation executed and saved.
let inFlightMutations = 0;
const idleWaiters: Array<() => void> = [];

// Background writes are serialized: each write reads the database only
// after the previous write finished, so the last write in the chain
// reflects every mutation.
let saveChain: Promise<void> = Promise.resolve();

function maybeResolveIdleWaiters(): void {
  if (inFlightMutations === 0) {
    const resolvers = idleWaiters.splice(0, idleWaiters.length);
    for (const resolve of resolvers) {
      resolve();
    }
  }
}

/**
 * Performs the file write of the last successful mutation in the
 * background. The mutation stays registered until the write has concluded
 * (successfully or with a logged failure). Writes are chained so that they
 * cannot interleave; skipping redundant writes is deliberately not done
 * here (see the coalescing save ticket).
 */
function scheduleBackgroundSave(): void {
  const write = saveChain.then(async () => {
    const target = saveTarget;
    const opossumZip = storedOpossumZip;
    if (target === undefined || opossumZip === undefined) {
      // No project is loaded, so there is no file to write to.
      return;
    }
    try {
      await saveFile(target, opossumZip);
    } catch (error) {
      console.error('Automatic save of the .opossum file failed.', error);
    }
  });
  saveChain = write;
  void write.finally(() => {
    inFlightMutations--;
    maybeResolveIdleWaiters();
  });
}

async function executeDbProcessMessage(
  msg: DbProcessRequest,
  onProgress?: LoadFileProgressCallback,
): Promise<SuccessPayload> {
  switch (msg.type) {
    case 'loadFile': {
      storedOpossumZip = undefined;
      const loadResult = await loadFile(msg.filePath, onProgress);
      if (loadResult.ok) {
        const { opossumZip, ...rest } = loadResult;
        storedOpossumZip = opossumZip;
        saveTarget = {
          projectId: rest.projectId,
          opossumFilePath: msg.filePath,
        };
        return rest;
      }
      return loadResult;
    }
    case 'saveFile': {
      if (!storedOpossumZip) {
        throw new Error('Cannot save: no input file loaded');
      }
      const { id: _, type: __, ...params } = msg;
      await saveFile(params, storedOpossumZip);
      return undefined;
    }
    case 'forceUnlock': {
      if (!storedOpossumZip) {
        throw new Error('Cannot force unlock: no input file loaded');
      }
      const { id: _, type: __, ...params } = msg;
      await forceUnlockOpossumFile(params, storedOpossumZip);
      return undefined;
    }
    case 'splitOpossumFile': {
      if (!storedOpossumZip) {
        throw new Error('Cannot split: no .opossum file is loaded');
      }
      const {
        id: _,
        type: __,
        selectedFolderPaths,
        splitOpossumFilePath,
        ...saveFileParams
      } = msg;
      // splitOpossumFile rewrites the source file as part of the split.
      await splitOpossumFile(
        {
          saveFileParams,
          selectedFolderPaths,
          splitOpossumFilePath,
        },
        storedOpossumZip,
      );
      return undefined;
    }
    case 'mergeOpossumFiles': {
      if (!storedOpossumZip) {
        return {
          errorMessage: 'Cannot merge: no .opossum file is loaded',
          errorType: MergeOpossumFilesErrorType.Unknown,
          status: 'error',
        };
      }
      const {
        id: _,
        type: __,
        ignoreReadonlyResourceOutputConflicts,
        partitionPaths,
        ...saveFileParams
      } = msg;
      const result = await mergeOpossumFiles(
        {
          ignoreReadonlyResourceOutputConflicts,
          saveFileParams,
          partitionPaths,
          reportProgress: onProgress,
        },
        storedOpossumZip,
      );
      if (result.status === 'error') {
        return result;
      }
      const loadResult = await loadFile(
        saveFileParams.opossumFilePath,
        onProgress,
      );
      if (!loadResult.ok) {
        return {
          errorMessage: `Could not reload merged archive: ${loadResult.error.message}`,
          errorType: MergeOpossumFilesErrorType.Unknown,
          status: 'error',
        };
      }
      storedOpossumZip = loadResult.opossumZip;
      // The merge rewrote the output file and it was reloaded from disk.
      return result;
    }
    case 'mergeOpossumFilesFromPaths': {
      const {
        id: _,
        type: __,
        ignoreReadonlyResourceOutputConflicts,
        inputPaths,
        outputPath,
      } = msg;
      return mergeOpossumFilesFromPaths({
        ignoreReadonlyResourceOutputConflicts,
        inputPaths,
        outputPath,
        reportProgress: onProgress,
      });
    }
    case 'exportFile': {
      await exportFile(msg.exportType, msg.filePath);
      return undefined;
    }
    case 'executeCommand': {
      // Mutations register before execution: the `whenIdle` wait may only
      // resolve after the mutation has been executed and its file write
      // has concluded. Other file-writing operations (forceUnlock,
      // splitOpossumFile, mergeOpossumFiles) await their writes before
      // responding, so their callers' requests cover them.
      if (isMutationCommand(msg.command)) {
        inFlightMutations++;
        try {
          const result = await executeCommand(msg.command, msg.params);
          scheduleBackgroundSave();
          return result;
        } catch (error) {
          // The command failed and did not change the database, so there
          // is no file write to wait for. Failed background writes are
          // logged and the awaited save at quit is the safety net.
          inFlightMutations--;
          maybeResolveIdleWaiters();
          throw error;
        }
      }
      return executeCommand(msg.command, msg.params);
    }
    case 'whenIdle': {
      if (inFlightMutations === 0) {
        return undefined;
      }
      await new Promise<void>((resolve) => {
        idleWaiters.push(resolve);
      });
      return undefined;
    }
  }
}

export async function handleDbProcessMessage(
  port: ResponsePort,
  msg: DbProcessRequest,
): Promise<void> {
  try {
    const result = await executeDbProcessMessage(msg, (message, level) => {
      port.postMessage({
        id: msg.id,
        type: 'progress',
        message,
        level,
      });
    });

    port.postMessage({ id: msg.id, type: 'success', result });
  } catch (err) {
    port.postMessage({
      id: msg.id,
      type: 'error',
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
  }
}

export function resetDbProcessStateForTesting(): void {
  storedOpossumZip = undefined;
  saveTarget = undefined;
  inFlightMutations = 0;
  idleWaiters.length = 0;
  saveChain = Promise.resolve();
}

// Guarded so that the module can be imported in tests, where
// process.parentPort does not exist.
if (process.parentPort) {
  process.parentPort.on('message', (event) => {
    const msg = event.data as { type: string };

    if (msg.type === 'port') {
      const port = event.ports[0];
      port.on('message', (portEvent: Electron.MessageEvent) => {
        void handleDbProcessMessage(port, portEvent.data as DbProcessRequest);
      });
      port.start();
    }
  });
}
