// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { MessageChannelMain, utilityProcess } from 'electron';
import path from 'path';

import type { ExportType } from '../../shared/shared-types';
import type {
  CommandName,
  CommandParams,
  CommandReturn,
} from '../api/commands';
import type { SaveFileParams } from '../api/saveFile';
import type { LoadFileGlobalState, LoadFileIpcResult } from '../input/loadFile';
import type {
  DbProcessPayload,
  DbProcessRequest,
  DbProcessResponse,
} from './dbProcess';

type ProgressCallback = (message: string, level?: 'info' | 'warn') => void;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  onProgress?: ProgressCallback;
}

// MessagePortMain (Electron main/utility process)
interface ElectronPort {
  postMessage(data: DbProcessRequest): void;
  on(event: 'message', handler: (event: { data: unknown }) => void): void;
  start(): void;
}

// MessagePort (Web API, used in preload/renderer)
interface WebPort {
  postMessage(data: DbProcessRequest): void;
  onmessage: ((event: MessageEvent) => void) | null;
}

type ClientPort = ElectronPort | WebPort;

let savingTime = 0;
let savingCount = 0;

export class DbProcessClient {
  private nextId = 0;
  private readonly pending = new Map<number, PendingRequest>();
  private readonly port: { postMessage(data: DbProcessRequest): void };

  constructor(port: ClientPort) {
    this.port = port;
    if ('on' in port) {
      port.on('message', (e) =>
        this.handleMessage(e.data as DbProcessResponse),
      );
      port.start();
    } else {
      port.onmessage = (e) => this.handleMessage(e.data);
    }
  }

  private handleMessage(msg: DbProcessResponse): void {
    const p = this.pending.get(msg.id);
    if (!p) {
      return;
    }
    if (msg.type === 'progress') {
      p.onProgress?.(msg.message, msg.level);
      return;
    }
    this.pending.delete(msg.id);
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

  private request(
    msg: DbProcessPayload,
    options?: { onProgress?: ProgressCallback },
  ): Promise<unknown> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, {
        resolve,
        reject,
        onProgress: options?.onProgress,
      });
      this.port.postMessage({ ...msg, id });
    });
  }

  api<C extends CommandName>(
    command: C,
    params: CommandParams<C>,
  ): Promise<Awaited<CommandReturn<C>>> {
    return this.request({
      type: 'executeCommand',
      command,
      params,
    }) as Promise<Awaited<CommandReturn<C>>>;
  }

  loadFile(
    filePath: string,
    globalState: LoadFileGlobalState,
    onProgress?: ProgressCallback,
  ): Promise<LoadFileIpcResult> {
    return this.request(
      { type: 'loadFile', filePath, globalState },
      { onProgress },
    ) as Promise<LoadFileIpcResult>;
  }

  async saveFile(params: SaveFileParams): Promise<void> {
    const begin = Date.now();
    const result = (await this.request({
      type: 'saveFile',
      ...params,
    })) as Promise<void>;
    const end = Date.now();

    savingCount += 1;
    savingTime += end - begin;
    console.log(
      `Saving ${savingCount}x ${savingTime} ms (avg ${savingTime / savingCount} ms)`,
    );

    return result;
  }

  exportFile(exportType: ExportType, filePath: string): Promise<void> {
    return this.request({
      type: 'exportFile',
      exportType,
      filePath,
    }) as Promise<void>;
  }
}

export const FRONTEND_TO_DB_PROCESS_PORT = 'frontend-to-db-process-port';

let child: Electron.UtilityProcess | null = null;

function ensureUtilityProcess(): Electron.UtilityProcess {
  if (!child) {
    child = utilityProcess.fork(path.join(__dirname, 'dbProcess.js'));
    child.on('exit', (code) => {
      console.error(`DB utility process exited with code ${code}`);
      child = null;
    });
  }
  return child;
}

export function getDbProcessPort(): Electron.MessagePortMain {
  const proc = ensureUtilityProcess();
  const { port1, port2 } = new MessageChannelMain();
  proc.postMessage({ type: 'port' }, [port1]);
  return port2;
}

let mainClient: DbProcessClient | null = null;

export function getMainDbClient(): DbProcessClient {
  if (!mainClient) {
    mainClient = new DbProcessClient(getDbProcessPort());
  }
  return mainClient;
}
