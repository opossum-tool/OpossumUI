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
  executeCommand,
} from '../api/commands';
import { exportFile } from '../api/exportCommands';
import { saveFile, type SaveFileParams } from '../api/saveFile';
import { loadFile, type LoadFileGlobalState } from '../input/loadFile';

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

export type DbProcessMessage = DbProcessPayload & { id: number };

type ResponsePort = {
  postMessage(message: unknown): void;
};

let storedInputFileRaw: Uint8Array | undefined;

function sendError(port: ResponsePort, id: number, err: unknown) {
  port.postMessage({
    id,
    type: 'error',
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
}

async function handleDbProcessMessage(
  port: ResponsePort,
  msg: DbProcessMessage,
): Promise<void> {
  try {
    let result: unknown;
    switch (msg.type) {
      case 'loadFile': {
        storedInputFileRaw = undefined;
        const loadResult = await loadFile(
          msg.filePath,
          msg.globalState,
          (message, level) => {
            port.postMessage({
              id: msg.id,
              type: 'progress',
              message,
              level,
            });
          },
        );
        if (loadResult.ok) {
          storedInputFileRaw = loadResult.inputFileRaw;
          const { inputFileRaw: _, ...rest } = loadResult;
          result = rest;
        } else {
          result = loadResult;
        }
        break;
      }
      case 'saveFile': {
        const { id: _, type: __, ...params } = msg;
        await saveFile(params as SaveFileParams, storedInputFileRaw);
        result = undefined;
        break;
      }
      case 'exportFile': {
        await exportFile(msg.exportType, msg.filePath);
        result = undefined;
        break;
      }
      case 'executeCommand': {
        result = await executeCommand(msg.command, msg.params);
        break;
      }
    }
    port.postMessage({ id: msg.id, type: 'success', result });
  } catch (err) {
    sendError(port, msg.id, err);
  }
}

process.parentPort.on('message', (event) => {
  const msg = event.data as { type: string };

  if (msg.type === 'port') {
    const port = event.ports[0];
    port.on('message', (portEvent: Electron.MessageEvent) => {
      void handleDbProcessMessage(port, portEvent.data as DbProcessMessage);
    });
    port.start();
  }
});
