// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';
import type { BrowserWindow } from 'electron';

import type { DbProcessRequest } from '../dbProcess/dbProcess';
import {
  loadFile,
  type LoadFileProgressCallback,
  type LoadFileResult,
} from '../input/loadFile';
import { openFileFromCliOrEnvVariableIfProvided } from '../main/openFileFromCliOrEnvVariableIfProvided';
import { resetDb } from './db';
import {
  getLastDevFile,
  invalidateCacheEntry,
  isDevDbCacheEnabled,
  prepareCacheEntry,
  refreshStatsAfterSave,
  setLastDevFile,
  touchAndGetFreshCacheEntry,
  writeCacheMeta,
} from './dev-db-cache';

/**
 * All points where the dev DB cache integrates with the production flows.
 * The production modules (loadFile, dbProcess, main) contain no cache
 * branching of their own — this module wraps them.
 */

export async function loadFileWithDevCache(
  filePath: string,
  reportProgress: LoadFileProgressCallback = () => {},
): Promise<LoadFileResult> {
  if (!isDevDbCacheEnabled()) {
    return loadFile(filePath, reportProgress);
  }

  const cacheEntry = touchAndGetFreshCacheEntry(filePath);
  if (cacheEntry) {
    try {
      reportProgress('Restoring database from dev cache');
      const opossumZip = new AdmZip(filePath);
      await resetDb(cacheEntry.dbPath);
      setLastDevFile(filePath);
      return {
        ok: true,
        opossumZip,
        projectTitle: cacheEntry.meta.projectTitle,
        projectId: cacheEntry.meta.projectId,
      };
    } catch (error) {
      reportProgress(
        `Dev cache restore failed, loading file from scratch (${
          error instanceof Error ? error.message : String(error)
        })`,
        'warn',
      );
    }
  }

  const result = await loadFile(filePath, reportProgress, {
    getDbFilename: () => prepareCacheEntry(filePath),
  });
  if (result.ok) {
    writeCacheMeta(filePath, {
      projectId: result.projectId,
      projectTitle: result.projectTitle,
    });
    setLastDevFile(filePath);
  }
  return result;
}

/**
 * Wraps the db process message execution so that dev cache maintenance runs
 * after every successful message. This module owns the mapping from message
 * types to the files they write:
 *
 * - Files rewritten by serializing the current database state stay cache-fresh
 *   (`saveFile`, `forceUnlock`, and the split source, which is saved and then
 *   rewritten with equivalent content).
 * - The split destination is overwritten with content that does not match any
 *   cached database, so its entry must be invalidated.
 * - File loads maintain the cache inside `loadFileWithDevCache`; merged
 *   archives are reloaded there as well.
 */
export function decorateDbProcessMessageExecution<ReturnType>(
  executeMessage: (
    msg: DbProcessRequest,
    onProgress?: LoadFileProgressCallback,
  ) => Promise<ReturnType>,
): typeof executeMessage {
  return async (msg, onProgress) => {
    const result = await executeMessage(msg, onProgress);
    maintainCacheAfterMessage(msg);
    return result;
  };
}

function maintainCacheAfterMessage(msg: DbProcessRequest): void {
  if (msg.type === 'saveFile' || msg.type === 'forceUnlock') {
    // The file was rewritten by serializing the current database state, so
    // the cached database (if any) still matches the file contents.
    refreshStatsAfterSave(msg.opossumFilePath);
  } else if (msg.type === 'splitOpossumFile') {
    refreshStatsAfterSave(msg.opossumFilePath);
    // The split destination is overwritten with content that does not match
    // any cached database, so its entry must be invalidated.
    invalidateCacheEntry(msg.splitOpossumFilePath);
  }
}

/**
 * Wraps the startup file opening so that, when the vite watcher restarted
 * Electron after a backend code change, the previously loaded file is
 * reopened from the dev DB cache. A fresh `yarn start` never reopens a file.
 */
export function openFileFromCliOrEnvVariableIfProvidedWithDevReopen(
  mainWindow: BrowserWindow,
  updateMenu: () => Promise<void>,
): Promise<void> {
  return openFileFromCliOrEnvVariableIfProvided(mainWindow, updateMenu, {
    getReopenFilePath: getDevReopenFilePath,
  });
}

function getDevReopenFilePath(): string | undefined {
  if (!isDevDbCacheEnabled()) {
    return undefined;
  }
  if (process.env.OPOSSUM_ELECTRON_RESTARTED !== '1') {
    return undefined;
  }
  const lastDevFile = getLastDevFile();
  return lastDevFile?.endsWith('.opossum') ? lastDevFile : undefined;
}
