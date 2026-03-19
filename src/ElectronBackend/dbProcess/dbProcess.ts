// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
// Electron utility process entry point.
// Receives MessagePorts from the main process via process.parentPort.
// Each port can send any type of work message (loadFile, saveFile,
// exportFile, executeCommand) and receives its response on the same port.
import type { ExportType } from '../../shared/shared-types';
import {
  type CommandName,
  type CommandParams,
  type CommandReturn,
  executeCommand,
} from '../api/commands';
import { exportFile } from '../api/exportCommands';
import { saveFile } from '../api/saveFile';
import {
  loadFile,
  type LoadFileGlobalState,
  type LoadFileIpcResult,
  type LoadFileProgressCallback,
} from '../input/loadFile';

interface LoadFileMessage {
  type: 'loadFile';
  filePath: string;
  globalState: LoadFileGlobalState;
}

interface SaveFileMessage {
  type: 'saveFile';
  projectId: string;
  inputFileChecksum?: string;
  opossumFilePath?: string;
  attributionFilePath?: string;
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

let storedInputFileRaw: Uint8Array | undefined;

async function executeDbProcessMessage(
  msg: DbProcessRequest,
  onProgress?: LoadFileProgressCallback,
): Promise<SuccessPayload> {
  switch (msg.type) {
    case 'loadFile': {
      storedInputFileRaw = undefined;
      const loadResult = await loadFile(
        msg.filePath,
        msg.globalState,
        onProgress,
      );
      if (loadResult.ok) {
        const { inputFileRaw, ...rest } = loadResult;
        storedInputFileRaw = inputFileRaw;
        return rest;
      }
      return loadResult;
    }
    case 'saveFile': {
      if (!storedInputFileRaw) {
        throw new Error('Cannot save: no input file loaded');
      }
      const { id: _, type: __, ...params } = msg;
      await saveFile(params, storedInputFileRaw);
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
