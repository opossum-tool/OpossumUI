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
  type ProgressCallback,
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
  type MergeOpossumFilesFromPathsParams,
  type MergeOpossumFilesParams,
} from '../api/mergeOpossumFiles';
import { saveFile } from '../api/saveFile';
import { splitOpossumFile } from '../api/splitOpossumFile';
import { loadFile, type LoadFileIpcResult } from '../input/loadFile';
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
  type: 'mergeOpossumFiles';
  params: MergeOpossumFilesParams;
}

interface MergeOpossumFilesFromPathsMessage {
  type: 'mergeOpossumFilesFromPaths';
  params: MergeOpossumFilesFromPathsParams;
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

interface FlushSavesMessage {
  type: 'flushSaves';
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
  | FlushSavesMessage;

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
const AUTOSAVE_INTERVAL_MS = 60_000;
let autosaveInterval: ReturnType<typeof setInterval> | undefined;
let loadingProject = false;

function stopAutosave(): void {
  clearInterval(autosaveInterval);
  autosaveInterval = undefined;
}

async function executeDbProcessMessage(
  msg: DbProcessRequest,
  onProgress?: ProgressCallback,
): Promise<SuccessPayload> {
  switch (msg.type) {
    case 'loadFile': {
      if (loadingProject) {
        throw new Error('Cannot load: another project load is in progress');
      }
      loadingProject = true;
      stopAutosave();
      try {
        // Flush while the old database, archive and save target are still current.
        await saveWorker.flush();
        storedOpossumZip = undefined;
        saveTarget = undefined;
        saveWorker = createSaveWorker();
        const loadResult = await loadFile(msg.filePath, onProgress);
        if (loadResult.ok) {
          const { opossumZip, ...rest } = loadResult;
          storedOpossumZip = opossumZip;
          saveTarget = {
            projectId: rest.projectId,
            opossumFilePath: msg.filePath,
          };
          const projectWorker = saveWorker;
          autosaveInterval = setInterval(
            () => projectWorker.autosave(),
            AUTOSAVE_INTERVAL_MS,
          );
          return rest;
        }
        return loadResult;
      } finally {
        loadingProject = false;
      }
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
      const { id: _, type: __, params } = msg;
      const opossumZip = storedOpossumZip;
      return saveWorker.run(async () => {
        const result = await mergeOpossumFiles(params, opossumZip, onProgress);
        if (result.status === 'error') {
          return result;
        }
        const loadResult = await loadFile(
          params.saveFileParams.opossumFilePath,
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
        return result;
      });
    }
    case 'mergeOpossumFilesFromPaths': {
      const { id: _, type: __, params } = msg;
      return saveWorker.run(() =>
        mergeOpossumFilesFromPaths(params, onProgress),
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
          { markDirty: storedOpossumZip !== undefined },
        );
      }
      return executeCommand(msg.command, msg.params);
    }
    case 'flushSaves': {
      return saveWorker.flush();
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
  stopAutosave();
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
