// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { MessageChannelMain, utilityProcess } from 'electron';
import path from 'path';

import type {
  ExportType,
  MergeOpossumFilesResult,
} from '../../shared/shared-types';
import type {
  CommandName,
  CommandParams,
  CommandReturn,
} from '../api/commands';
import type {
  MergeOpossumFilesFromPathsParams,
  MergeOpossumFilesParams,
} from '../api/mergeOpossumFiles';
import type { SaveFileParams } from '../api/saveFile';
import type { SplitOpossumFileParams } from '../api/splitOpossumFile';
import type { LoadFileIpcResult } from '../input/loadFile';
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

export class DbProcessClient {
  private nextId = 0;
  private dead = false;
  private readonly pending = new Map<number, PendingRequest>();
  private readonly idleResolvers: Array<() => void> = [];
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
    if (this.pending.size === 0) {
      const resolvers = this.idleResolvers.splice(0, this.idleResolvers.length);
      for (const resolve of resolvers) {
        resolve();
      }
    }
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
    if (this.dead) {
      return Promise.reject(
        new Error('The DB process has exited; no further requests are sent.'),
      );
    }
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

  /**
   * Resolves once all requests sent over this client have been answered by
   * the DB process. Used to await pending background file writes before
   * the app quits.
   */
  async whenIdle(): Promise<void> {
    if (this.pending.size === 0) {
      return;
    }
    await new Promise<void>((resolve) => {
      this.idleResolvers.push(resolve);
    });
  }

  /**
   * Whether the DB process has exited and this client rejects new requests
   * (see `failPendingRequests`).
   */
  isDead(): boolean {
    return this.dead;
  }

  /**
   * Rejects all requests that are still waiting for a DB process response
   * and resolves all `whenIdle` waiters. Called when the DB process exits;
   * afterwards this client rejects any new request immediately.
   */
  failPendingRequests(error: Error): void {
    this.dead = true;
    const requests = Array.from(this.pending.values());
    this.pending.clear();
    const idleResolvers = this.idleResolvers.splice(
      0,
      this.idleResolvers.length,
    );
    for (const request of requests) {
      request.reject(error);
    }
    for (const resolve of idleResolvers) {
      resolve();
    }
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
    onProgress?: ProgressCallback,
  ): Promise<LoadFileIpcResult> {
    return this.request(
      { type: 'loadFile', filePath },
      { onProgress },
    ) as Promise<LoadFileIpcResult>;
  }

  saveFile(params: SaveFileParams): Promise<void> {
    return this.request({ type: 'saveFile', ...params }) as Promise<void>;
  }

  forceUnlock(params: SaveFileParams): Promise<void> {
    return this.request({ type: 'forceUnlock', ...params }) as Promise<void>;
  }

  splitOpossumFile({
    saveFileParams,
    selectedFolderPaths,
    splitOpossumFilePath,
  }: SplitOpossumFileParams): Promise<void> {
    return this.request({
      type: 'splitOpossumFile',
      ...saveFileParams,
      selectedFolderPaths,
      splitOpossumFilePath,
    }) as Promise<void>;
  }

  mergeOpossumFiles(
    {
      ignoreReadonlyResourceOutputConflicts,
      saveFileParams,
      partitionPaths,
    }: MergeOpossumFilesParams,
    onProgress?: ProgressCallback,
  ): Promise<MergeOpossumFilesResult> {
    return this.request(
      {
        ignoreReadonlyResourceOutputConflicts,
        type: 'mergeOpossumFiles',
        ...saveFileParams,
        partitionPaths,
      },
      { onProgress },
    ) as Promise<MergeOpossumFilesResult>;
  }

  mergeOpossumFilesFromPaths(
    {
      ignoreReadonlyResourceOutputConflicts,
      inputPaths,
      outputPath,
    }: MergeOpossumFilesFromPathsParams,
    onProgress?: ProgressCallback,
  ): Promise<MergeOpossumFilesResult> {
    return this.request(
      {
        ignoreReadonlyResourceOutputConflicts,
        inputPaths,
        outputPath,
        type: 'mergeOpossumFilesFromPaths',
      },
      { onProgress },
    ) as Promise<MergeOpossumFilesResult>;
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
      mainClient?.failPendingRequests(
        new Error(`The DB process exited with code ${code}.`),
      );
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
