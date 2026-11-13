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
import { type SaveResult, SaveWorker } from './save-worker';

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

interface WaitForPendingSavesMessage {
  type: 'waitForPendingSaves';
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
  | WaitForPendingSavesMessage;

export type DbProcessRequest = DbProcessPayload & { id: number };

type SuccessPayload =
  | LoadFileIpcResult
  | Awaited<CommandReturn<CommandName>>
  | MergeOpossumFilesResult
  | boolean
  | SaveResult
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

async function writeCurrentProject(): Promise<void> {
  const target = saveTarget;
  const opossumZip = storedOpossumZip;
  if (target === undefined || opossumZip === undefined) {
    // No project is loaded, so there is no file to write to.
    return;
  }
  await saveFile(target, opossumZip);
}

function createSaveWorker(): SaveWorker {
  return new SaveWorker({ writeCurrentProject });
}

let saveWorker = createSaveWorker();

async function executeDbProcessMessage(
  msg: DbProcessRequest,
  onProgress?: LoadFileProgressCallback,
): Promise<SuccessPayload> {
  switch (msg.type) {
    case 'loadFile': {
      storedOpossumZip = undefined;
      saveWorker.resetSaveOutcome();
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
      await saveWorker.save();
      return undefined;
    }
    case 'forceUnlock': {
      if (!storedOpossumZip) {
        throw new Error('Cannot force unlock: no input file loaded');
      }
      const opossumZip = storedOpossumZip;
      const { id: _, type: __, ...params } = msg;
      await saveWorker.run(() => forceUnlockOpossumFile(params, opossumZip));
      return undefined;
    }
    case 'splitOpossumFile': {
      if (!storedOpossumZip) {
        throw new Error('Cannot split: no .opossum file is loaded');
      }
      const opossumZip = storedOpossumZip;
      const {
        id: _,
        type: __,
        selectedFolderPaths,
        splitOpossumFilePath,
        ...saveFileParams
      } = msg;
      // splitOpossumFile rewrites the source file as part of the split.
      await saveWorker.run(() =>
        splitOpossumFile(
          {
            saveFileParams,
            selectedFolderPaths,
            splitOpossumFilePath,
          },
          opossumZip,
        ),
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
      const opossumZip = storedOpossumZip;
      const {
        id: _,
        type: __,
        ignoreReadonlyResourceOutputConflicts,
        partitionPaths,
        ...saveFileParams
      } = msg;
      return saveWorker.run(async () => {
        const result = await mergeOpossumFiles(
          {
            ignoreReadonlyResourceOutputConflicts,
            saveFileParams,
            partitionPaths,
            reportProgress: onProgress,
          },
          opossumZip,
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
      });
    }
    case 'mergeOpossumFilesFromPaths': {
      const {
        id: _,
        type: __,
        ignoreReadonlyResourceOutputConflicts,
        inputPaths,
        outputPath,
      } = msg;
      return saveWorker.run(() =>
        mergeOpossumFilesFromPaths({
          ignoreReadonlyResourceOutputConflicts,
          inputPaths,
          outputPath,
          reportProgress: onProgress,
        }),
      );
    }
    case 'exportFile': {
      await saveWorker.run(() => exportFile(msg.exportType, msg.filePath));
      return undefined;
    }
    case 'executeCommand': {
      if (isMutationCommand(msg.command)) {
        return saveWorker.run(
          (): Promise<SuccessPayload> =>
            executeCommand(msg.command, msg.params),
          { saveInBackground: true },
        );
      }
      return executeCommand(msg.command, msg.params);
    }
    case 'waitForPendingSaves': {
      return saveWorker.waitForPendingSaves();
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
  saveWorker = createSaveWorker();
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
