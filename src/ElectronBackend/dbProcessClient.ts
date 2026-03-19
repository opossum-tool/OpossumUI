// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
// Main-process client for the DB utility process.
// Manages the utility process lifecycle and provides async wrappers for
// main→utility communication (loadFile, saveFile, exportFile).
// Renderer↔utility communication is handled via a direct MessagePort
// (set up through connectRenderer).
import {
  type BrowserWindow,
  MessageChannelMain,
  utilityProcess,
} from 'electron';
import path from 'path';

import type { ExportType } from '../shared/shared-types';
import type { SaveFileParams } from './api/saveFile';
import type { LoadFileGlobalState, LoadFileIpcResult } from './input/loadFile';

interface SuccessResponse {
  id: number;
  type: 'success';
  result: unknown;
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

type ProcessResponse = SuccessResponse | ErrorResponse | ProgressResponse;

type ProgressCallback = (message: string, level?: 'info' | 'warn') => void;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  onProgress?: ProgressCallback;
}

let child: Electron.UtilityProcess | null = null;
let nextId = 0;
const pending = new Map<number, PendingRequest>();

function handleMessage(msg: ProcessResponse) {
  const p = pending.get(msg.id);
  if (!p) {
    return;
  }
  if (msg.type === 'progress') {
    p.onProgress?.(msg.message, msg.level);
    return;
  }
  pending.delete(msg.id);
  if (msg.type === 'error') {
    const err = new Error(msg.error);
    if (msg.stack) {
      err.stack = msg.stack;
    }
    p.reject(err);
  } else {
    p.resolve(msg.result);
  }
}

export function startUtilityProcess(): void {
  if (child) {
    return;
  }
  child = utilityProcess.fork(path.join(__dirname, 'dbProcess.js'));
  child.on('message', handleMessage);
  child.on('exit', (code) => {
    console.error(`DB utility process exited with code ${code}`);
    for (const [id, p] of pending) {
      p.reject(new Error(`Utility process exited with code ${code}`));
      pending.delete(id);
    }
    child = null;
  });
}

export const FRONTEND_TO_DB_PROCESS_PORT = 'frontend-to-db-process-port';

export function connectRenderer(mainWindow: BrowserWindow): void {
  if (!child) {
    throw new Error('Utility process not started');
  }
  const { port1, port2 } = new MessageChannelMain();
  child.postMessage({ type: 'rendererPort' }, [port1]);
  mainWindow.webContents.postMessage(FRONTEND_TO_DB_PROCESS_PORT, null, [
    port2,
  ]);
}

function request(
  msg: Record<string, unknown>,
  options?: {
    onProgress?: ProgressCallback;
  },
): Promise<unknown> {
  if (!child) {
    throw new Error('Utility process not started');
  }
  const id = nextId++;

  return new Promise((resolve, reject) => {
    pending.set(id, {
      resolve,
      reject,
      onProgress: options?.onProgress,
    });
    child!.postMessage({ ...msg, id });
  });
}

export function loadFileInUtilityProcess(
  filePath: string,
  globalState: LoadFileGlobalState,
  onProgress?: ProgressCallback,
): Promise<LoadFileIpcResult> {
  return request(
    { type: 'loadFile', filePath, globalState },
    { onProgress },
  ) as Promise<LoadFileIpcResult>;
}

export function saveFileInUtilityProcess(
  params: SaveFileParams,
): Promise<void> {
  return request({ type: 'saveFile', ...params }) as Promise<void>;
}

export function exportFileInUtilityProcess(
  exportType: ExportType,
  filePath: string,
): Promise<void> {
  return request({ type: 'exportFile', exportType, filePath }) as Promise<void>;
}
