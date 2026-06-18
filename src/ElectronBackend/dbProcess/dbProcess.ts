// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
// Electron utility process entry point.
// Receives MessagePorts from the main process via process.parentPort.
// Each port can send any type of work message (loadFile, saveFile,
// exportFile, executeCommand) and receives its response on the same port.
import type AdmZip from 'adm-zip';

import type { ExportType } from '../../shared/shared-types';
import { writeOpossumFile } from '../../shared/write-file';
import {
  type CommandName,
  type CommandParams,
  type CommandReturn,
  executeCommand,
} from '../api/commands';
import { exportFile } from '../api/exportCommands';
import { buildOpossumOutputFile } from '../api/buildOpossumOutputFile';
import {
  loadFile,
  type LoadFileGlobalState,
  type LoadFileIpcResult,
  type LoadFileProgressCallback,
} from '../input/loadFile';
import {
  type LoadedArchive,
  loadLegacyFile,
  loadOpossumFile,
} from '../input/parseFile';

interface LoadOpossumFileMessage {
  type: 'loadFile';
  format: 'opossum';
  opossumFilePath: string;
  globalState: LoadFileGlobalState;
}

interface LoadLegacyFileMessage {
  type: 'loadFile';
  format: 'legacy';
  inputFilePath: string;
  opossumFilePath: string;
  globalState: LoadFileGlobalState;
}

export type LoadFileMessage = LoadOpossumFileMessage | LoadLegacyFileMessage;

interface SaveFileMessage {
  type: 'saveFile';
  projectId: string;
  opossumFilePath: string;
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
  | ExportFileMessage
  | ExecuteCommandMessage;

export type DbProcessRequest = DbProcessPayload & { id: number };

type SuccessPayload =
  | LoadFileIpcResult
  | Awaited<CommandReturn<CommandName>>
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
  | SuccessResponse
  | ErrorResponse
  | ProgressResponse;

type ResponsePort = {
  postMessage(message: DbProcessResponse): void;
};

let storedOpossumZip: AdmZip | undefined;

async function loadArchive(
  msg: LoadFileMessage,
  onProgress?: LoadFileProgressCallback,
): Promise<LoadedArchive | LoadFileIpcResult> {
  if (msg.format === 'opossum') {
    onProgress?.(`Reading file ${msg.opossumFilePath}`);
    const result = await loadOpossumFile(msg.opossumFilePath);
    if ('type' in result && 'message' in result) {
      return { ok: false, error: result };
    }
    return result;
  }

  onProgress?.('Parsing input file');
  const result = await loadLegacyFile(msg.inputFilePath);
  if ('type' in result && 'message' in result) {
    return { ok: false, error: result };
  }
  return result;
}

async function executeDbProcessMessage(
  msg: DbProcessRequest,
  onProgress?: LoadFileProgressCallback,
): Promise<SuccessPayload> {
  switch (msg.type) {
    case 'loadFile': {
      storedOpossumZip = undefined;
      const archiveOrError = await loadArchive(msg, onProgress);
      if ('ok' in archiveOrError) {
        return archiveOrError;
      }
      const archive = archiveOrError;
      const loadResult = await loadFile(
        msg.opossumFilePath,
        archive,
        msg.globalState,
        onProgress,
      );
      if (loadResult.ok) {
        const { opossumZip, ...rest } = loadResult;
        storedOpossumZip = opossumZip;
        return rest;
      }
      return loadResult;
    }
    case 'saveFile': {
      if (!storedOpossumZip) {
        throw new Error('Cannot save: no input file loaded');
      }
      const output = await buildOpossumOutputFile(msg.projectId);
      writeOpossumFile({
        path: msg.opossumFilePath,
        zip: storedOpossumZip,
        output,
      });
      return undefined;
    }
    case 'exportFile': {
      await exportFile(msg.exportType, msg.filePath);
      return undefined;
    }
    case 'executeCommand': {
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
