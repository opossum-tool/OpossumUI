// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';
import type { BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';

import { EMPTY_PROJECT_METADATA } from '../../../Frontend/shared-constants';
import { writeOpossumFile } from '../../../shared/write-file';
import { INPUT_FILE_NAME } from '../../../shared/write-file-utils';
import { faker } from '../../../testing/Faker';
import type { DbProcessRequest } from '../../dbProcess/dbProcess';
import type { ParsedOpossumInputFile } from '../../types/types';
import { getDb, resetDb } from '../db';
import {
  prepareCacheEntry,
  setLastDevFile,
  touchAndGetFreshCacheEntry,
  writeCacheMeta,
} from '../dev-db-cache';
import {
  decorateDbProcessMessageExecution,
  loadFileWithDevCache,
  openFileFromCliOrEnvVariableIfProvidedWithDevReopen,
} from '../dev-db-cache-wiring';

const mockHandleOpeningFile = vi.hoisted(() => vi.fn());

vi.mock('../../main/listeners', () => ({
  handleOpeningFile: (...args: never): void => mockHandleOpeningFile(args),
}));

const externalAttributionUuid = 'ecd692d9-b154-4d4d-be8c-external';
const source = faker.opossum.source();
const inputFileContent: ParsedOpossumInputFile = {
  metadata: {
    ...EMPTY_PROJECT_METADATA,
    projectId: 'wiring-test-project',
    projectTitle: 'Wiring Test',
  },
  resources: { a: 1 },
  config: { classifications: {} },
  externalAttributions: {
    [externalAttributionUuid]: {
      source,
      packageName: 'my app',
      packageVersion: '1.2.3',
    },
  },
  frequentLicenses: [],
  resourcesToAttributions: { '/a': [externalAttributionUuid] },
};

describe('dev-db-cache-wiring', () => {
  const oldEnv = process.env;
  let cacheDir: string;
  let opossumFilePath: string;

  function createCacheEntry(filePath: string): void {
    fs.writeFileSync(filePath, 'opossum file content');
    const dbPath = prepareCacheEntry(filePath) as string;
    fs.writeFileSync(dbPath, 'cached db content');
    writeCacheMeta(filePath, { projectId: 'project-id' });
  }

  beforeEach(() => {
    process.env = { ...oldEnv };
    cacheDir = faker.outputPath(`${faker.string.uuid()}-cache`);
    opossumFilePath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    process.env.OPOSSUM_DEV_DB_CACHE_DIR = cacheDir;
    delete process.env.OPOSSUM_DEV_MODE;
    delete process.env.OPOSSUM_DISABLE_DEV_DB_CACHE;
    delete process.env.OPOSSUM_ELECTRON_RESTARTED;
  });

  afterEach(async () => {
    process.env = oldEnv;
    vi.restoreAllMocks();
    await resetDb();
  });

  describe('loadFileWithDevCache', () => {
    beforeEach(async () => {
      await writeOpossumFile({
        input: inputFileContent,
        path: opossumFilePath,
      });
    });

    it('loads without cache when the cache is disabled', async () => {
      const result = await loadFileWithDevCache(opossumFilePath);

      expect(result.ok).toBe(true);
      expect(fs.existsSync(cacheDir)).toBe(false);
    });

    it('imports into the cache and records the meta data', async () => {
      process.env.OPOSSUM_DEV_MODE = '1';

      const result = await loadFileWithDevCache(opossumFilePath);

      expect(result.ok).toBe(true);
      const entry = touchAndGetFreshCacheEntry(opossumFilePath);
      expect(entry?.meta.projectId).toBe('wiring-test-project');
      expect(entry?.meta.projectTitle).toBe('Wiring Test');
    });

    it('restores the database from the cache on a second load', async () => {
      process.env.OPOSSUM_DEV_MODE = '1';
      const firstLoad = await loadFileWithDevCache(opossumFilePath);
      expect(firstLoad.ok).toBe(true);

      const progressMessages: Array<string> = [];
      const secondLoad = await loadFileWithDevCache(
        opossumFilePath,
        (message) => {
          progressMessages.push(message);
        },
      );

      expect(secondLoad.ok).toBe(true);
      expect(progressMessages).toEqual(['Restoring database from dev cache']);
      const attributions = await getDb()
        .selectFrom('attribution')
        .select('uuid')
        .execute();
      expect(attributions).toEqual([{ uuid: externalAttributionUuid }]);
    });

    it('falls back to a full import when the cached database is unusable', async () => {
      process.env.OPOSSUM_DEV_MODE = '1';
      const firstLoad = await loadFileWithDevCache(opossumFilePath);
      expect(firstLoad.ok).toBe(true);
      const dbPath = touchAndGetFreshCacheEntry(opossumFilePath)!.dbPath;
      await resetDb();
      fs.writeFileSync(dbPath, 'this is not a sqlite database');

      const progressMessages: Array<string> = [];
      const secondLoad = await loadFileWithDevCache(
        opossumFilePath,
        (message) => {
          progressMessages.push(message);
        },
      );

      expect(secondLoad.ok).toBe(true);
      expect(progressMessages[0]).toBe('Restoring database from dev cache');
      expect(progressMessages[1]).toContain(
        'Dev cache restore failed, loading file from scratch',
      );
      expect(progressMessages).toContain('Loading into database');
    });

    it('does not record meta data when the load fails', async () => {
      process.env.OPOSSUM_DEV_MODE = '1';
      const corruptZip = new AdmZip();
      corruptZip.addFile(INPUT_FILE_NAME, Buffer.from('{"name": 3'));
      await corruptZip.writeZipPromise(opossumFilePath);

      const result = await loadFileWithDevCache(opossumFilePath);

      expect(result.ok).toBe(false);
      expect(touchAndGetFreshCacheEntry(opossumFilePath)).toBeUndefined();
    });
  });

  describe('decorateDbProcessMessageExecution', () => {
    beforeEach(() => {
      process.env.OPOSSUM_DEV_MODE = '1';
    });

    it('keeps the cache fresh when a message rewrote the file', async () => {
      createCacheEntry(opossumFilePath);
      // Simulates a save: the file is rewritten with the current DB state.
      fs.writeFileSync(opossumFilePath, 'rewritten with current db state');

      await decorateDbProcessMessageExecution(() => Promise.resolve(undefined))(
        {
          type: 'saveFile',
          id: 1,
          projectId: 'project-id',
          opossumFilePath,
        },
      );

      expect(touchAndGetFreshCacheEntry(opossumFilePath)).toBeDefined();
    });

    it('invalidates the split destination entry', async () => {
      createCacheEntry(opossumFilePath);
      const splitDestinationPath = faker.outputPath(
        `${faker.string.uuid()}.opossum`,
      );
      createCacheEntry(splitDestinationPath);

      await decorateDbProcessMessageExecution(() => Promise.resolve(undefined))(
        {
          type: 'splitOpossumFile',
          id: 1,
          projectId: 'project-id',
          opossumFilePath,
          selectedFolderPaths: [],
          splitOpossumFilePath: splitDestinationPath,
        },
      );

      expect(touchAndGetFreshCacheEntry(opossumFilePath)).toBeDefined();
      expect(touchAndGetFreshCacheEntry(splitDestinationPath)).toBeUndefined();
    });

    it('does not touch the cache when the message fails', async () => {
      createCacheEntry(opossumFilePath);
      fs.writeFileSync(opossumFilePath, 'changed without a matching db');

      await expect(
        decorateDbProcessMessageExecution(() =>
          Promise.reject(new Error('command failed')),
        )({
          type: 'saveFile',
          id: 1,
          projectId: 'project-id',
          opossumFilePath,
        }),
      ).rejects.toThrow('command failed');

      expect(touchAndGetFreshCacheEntry(opossumFilePath)).toBeUndefined();
    });

    it('leaves load-related messages untouched', async () => {
      createCacheEntry(opossumFilePath);

      await decorateDbProcessMessageExecution(() => Promise.resolve(undefined))(
        {
          type: 'loadFile',
          id: 1,
          filePath: opossumFilePath,
        } as unknown as DbProcessRequest,
      );

      expect(touchAndGetFreshCacheEntry(opossumFilePath)).toBeDefined();
    });
  });

  describe('openFileFromCliOrEnvVariableIfProvidedWithDevReopen', () => {
    beforeEach(() => {
      process.argv = ['app'];
      mockHandleOpeningFile.mockClear();
    });

    it('reopens the last file after a watcher restart', async () => {
      process.env.OPOSSUM_DEV_MODE = '1';
      process.env.OPOSSUM_ELECTRON_RESTARTED = '1';
      setLastDevFile(opossumFilePath);
      fs.writeFileSync(opossumFilePath, 'opossum');

      await openFileFromCliOrEnvVariableIfProvidedWithDevReopen(
        'mockBrowserWindow' as unknown as BrowserWindow,
        vi.fn(),
      );

      expect(mockHandleOpeningFile).toHaveBeenCalledTimes(1);
      expect(mockHandleOpeningFile).toHaveBeenCalledWith([
        'mockBrowserWindow',
        path.resolve(opossumFilePath),
        expect.any(Function),
      ]);
    });

    it('opens nothing on a fresh start', async () => {
      process.env.OPOSSUM_DEV_MODE = '1';
      setLastDevFile(opossumFilePath);
      fs.writeFileSync(opossumFilePath, 'opossum');

      await openFileFromCliOrEnvVariableIfProvidedWithDevReopen(
        'mockBrowserWindow' as unknown as BrowserWindow,
        vi.fn(),
      );

      expect(mockHandleOpeningFile).not.toHaveBeenCalled();
    });
  });
});
