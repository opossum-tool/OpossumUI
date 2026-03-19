// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
// Electron utility process entry point.
// Receives MessagePorts from the main process via process.parentPort.
// Each port can send any type of work message (loadFile, saveFile,
// exportFile, executeCommand) and receives its response on the same port.
import { ExportType } from '../shared/shared-types';
import {
  type CommandName,
  type CommandParams,
  executeCommand,
} from './api/commands';
import {
  exportCompactBom,
  exportDetailedBom,
  exportFollowUp,
  exportSpdxDocument,
} from './api/exportCommands';
import { saveFile, type SaveFileParams } from './api/saveFile';
import { loadFile, type LoadFileGlobalState } from './input/loadFile';

interface LoadFileMessage {
  id: number;
  type: 'loadFile';
  filePath: string;
  globalState: LoadFileGlobalState;
}

interface SaveFileMessage {
  id: number;
  type: 'saveFile';
  projectId: string;
  inputFileChecksum?: string;
  opossumFilePath?: string;
  attributionFilePath?: string;
}

interface ExportFileMessage {
  id: number;
  type: 'exportFile';
  exportType: ExportType;
  filePath: string;
}

interface ExecuteCommandMessage {
  id: number;
  type: 'executeCommand';
  command: CommandName;
  params: CommandParams<CommandName>;
}

type WorkMessage =
  | LoadFileMessage
  | SaveFileMessage
  | ExportFileMessage
  | ExecuteCommandMessage;

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

async function handleWorkMessage(
  port: ResponsePort,
  msg: WorkMessage,
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
        switch (msg.exportType) {
          case ExportType.FollowUp:
            await exportFollowUp({ filePath: msg.filePath });
            break;
          case ExportType.CompactBom:
            await exportCompactBom({ filePath: msg.filePath });
            break;
          case ExportType.DetailedBom:
            await exportDetailedBom({ filePath: msg.filePath });
            break;
          case ExportType.SpdxDocumentJson:
          case ExportType.SpdxDocumentYaml:
            await exportSpdxDocument({
              type: msg.exportType,
              filePath: msg.filePath,
            });
            break;
        }
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
      void handleWorkMessage(port, portEvent.data as WorkMessage);
    });
    port.start();
  }
});
