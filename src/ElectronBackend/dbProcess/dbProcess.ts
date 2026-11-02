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

export type DbProcessPayload =
  | LoadFileMessage
  | SaveFileMessage
  | ForceUnlockMessage
  | SplitOpossumFileMessage
  | MergeOpossumFilesMessage
  | MergeOpossumFilesFromPathsMessage
  | ExportFileMessage
  | ExecuteCommandMessage;

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

// The DB process is the single funnel through which all ports' traffic
// flows, so it is the place to track whether the .opossum file on disk is
// up to date with the database state. Mutations arriving over any port
// mark the file as stale.
let hasUnsavedChanges = false;
// Monotonically bumped on every change and every file rewrite. A save
// captures the generation when it starts and only clears the flag if no
// change arrived while it was writing.
let changeGeneration = 0;

function markUnsavedChanges(): void {
  hasUnsavedChanges = true;
  changeGeneration++;
}

function markFileSaved(): void {
  hasUnsavedChanges = false;
  changeGeneration++;
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
        // loadFile writes the (normalized) file back to disk right after
        // loading, so the file is fresh at this point.
        markFileSaved();
        return rest;
      }
      return loadResult;
    }
    case 'saveFile': {
      if (!storedOpossumZip) {
        throw new Error('Cannot save: no input file loaded');
      }
      if (!hasUnsavedChanges) {
        return undefined;
      }
      const { id: _, type: __, ...params } = msg;
      const generation = changeGeneration;
      await saveFile(params, storedOpossumZip);
      if (changeGeneration === generation) {
        hasUnsavedChanges = false;
      }
      return undefined;
    }
    case 'forceUnlock': {
      if (!storedOpossumZip) {
        throw new Error('Cannot force unlock: no input file loaded');
      }
      const { id: _, type: __, ...params } = msg;
      await forceUnlockOpossumFile(params, storedOpossumZip);
      markFileSaved();
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
      await splitOpossumFile(
        {
          saveFileParams,
          selectedFolderPaths,
          splitOpossumFilePath,
        },
        storedOpossumZip,
      );
      // splitOpossumFile rewrites the source file as part of the split.
      markFileSaved();
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
      markFileSaved();
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
      // Mark the file as stale before running the mutation so that even a
      // save racing this mutation cannot mark the file as saved.
      if (isMutationCommand(msg.command)) {
        markUnsavedChanges();
      }
      return executeCommand(msg.command, msg.params);
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
