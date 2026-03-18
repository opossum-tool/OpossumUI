// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
// Electron utility process entry point.
// Two communication channels:
//   1. process.parentPort — messages from the main process (loadFile, saveFile, exportFile)
//   2. rendererPort       — direct MessagePort to the renderer (executeCommand)
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

interface RendererPortMessage {
  type: 'rendererPort';
}

type MainMessage =
  | LoadFileMessage
  | SaveFileMessage
  | ExportFileMessage
  | RendererPortMessage;

interface ExecuteCommandMessage {
  id: number;
  type: 'executeCommand';
  command: CommandName;
  params: CommandParams<CommandName>;
}

let storedInputFileRaw: Uint8Array | undefined;
let currentRendererPort: Electron.MessagePortMain | null = null;

function sendError(
  port: { postMessage(value: unknown): void },
  id: number,
  err: unknown,
) {
  port.postMessage({
    id,
    type: 'error',
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
}

function handleRendererMessage(port: { postMessage(value: unknown): void }) {
  return async (event: { data: ExecuteCommandMessage }) => {
    const msg = event.data;
    try {
      const result = await executeCommand(msg.command, msg.params);
      port.postMessage({ id: msg.id, type: 'success', result });
    } catch (err) {
      sendError(port, msg.id, err);
    }
  };
}

process.parentPort.on('message', async (event) => {
  const msg = event.data as MainMessage;

  if (msg.type === 'rendererPort') {
    if (currentRendererPort) {
      currentRendererPort.close();
    }
    currentRendererPort = event.ports[0];
    currentRendererPort.on(
      'message',
      handleRendererMessage(currentRendererPort),
    );
    currentRendererPort.start();
    return;
  }

  try {
    let result: unknown;
    switch (msg.type) {
      case 'loadFile': {
        storedInputFileRaw = undefined;
        const loadResult = await loadFile(
          msg.filePath,
          msg.globalState,
          (message, level) => {
            process.parentPort.postMessage({
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
    }
    process.parentPort.postMessage({ id: msg.id, type: 'success', result });
  } catch (err) {
    sendError(process.parentPort, msg.id, err);
  }
});
