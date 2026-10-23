// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import path from 'path';

import { faker } from '../../../testing/Faker';
import {
  getLastDevFile,
  invalidateCacheEntry,
  isDevDbCacheEnabled,
  prepareCacheEntry,
  refreshStatsAfterSave,
  setLastDevFile,
  touchAndGetFreshCacheEntry,
  writeCacheMeta,
} from '../dev-db-cache';

describe('dev-db-cache', () => {
  const oldEnv = process.env;
  let cacheDir: string;
  let opossumFilePath: string;

  function writeTestFile(filePath: string, content: string): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }

  function createCacheEntry(filePath: string): {
    dbPath: string;
    entryDir: string;
  } {
    const dbPath = prepareCacheEntry(filePath);
    expect(dbPath).toBeDefined();
    // The database file is created by the import in the real flow.
    fs.writeFileSync(dbPath as string, 'db content');
    writeCacheMeta(filePath, { projectId: 'project-id' });
    return {
      dbPath: dbPath as string,
      entryDir: path.dirname(dbPath as string),
    };
  }

  beforeEach(() => {
    process.env = { ...oldEnv };
    cacheDir = faker.outputPath(`${faker.string.uuid()}-cache`);
    opossumFilePath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    process.env.OPOSSUM_DEV_DB_CACHE_DIR = cacheDir;
    delete process.env.OPOSSUM_DEV_MODE;
    delete process.env.OPOSSUM_DISABLE_DEV_DB_CACHE;
    writeTestFile(opossumFilePath, 'opossum file content');
  });

  afterEach(() => {
    process.env = oldEnv;
    vi.restoreAllMocks();
  });

  describe('isDevDbCacheEnabled', () => {
    it('is disabled when the dev-mode constant is not set', () => {
      expect(isDevDbCacheEnabled()).toBe(false);
    });

    it('is enabled when the dev-mode constant is set', () => {
      process.env.OPOSSUM_DEV_MODE = '1';
      expect(isDevDbCacheEnabled()).toBe(true);
    });

    it('is disabled when explicitly disabled', () => {
      process.env.OPOSSUM_DEV_MODE = '1';
      process.env.OPOSSUM_DISABLE_DEV_DB_CACHE = '1';
      expect(isDevDbCacheEnabled()).toBe(false);
    });
  });

  describe('cache entries', () => {
    beforeEach(() => {
      process.env.OPOSSUM_DEV_MODE = '1';
    });

    it('returns no entry for unknown files', () => {
      expect(touchAndGetFreshCacheEntry(opossumFilePath)).toBeUndefined();
    });

    it('stores and restores a fresh cache entry', () => {
      const { dbPath } = createCacheEntry(opossumFilePath);

      const entry = touchAndGetFreshCacheEntry(opossumFilePath);
      expect(entry).toBeDefined();
      expect(entry?.dbPath).toBe(dbPath);
      expect(entry?.meta.projectId).toBe('project-id');
    });

    it('keeps the project title in the meta data', () => {
      createCacheEntry(opossumFilePath);
      writeCacheMeta(opossumFilePath, {
        projectId: 'project-id',
        projectTitle: 'My Project',
      });

      const entry = touchAndGetFreshCacheEntry(opossumFilePath);
      expect(entry?.meta.projectTitle).toBe('My Project');
    });

    it('treats paths with different separators as the same file', () => {
      createCacheEntry(opossumFilePath);

      const slashVariant = opossumFilePath.replace(/\\/g, '/');
      expect(touchAndGetFreshCacheEntry(slashVariant)).toBeDefined();
    });

    it.skipIf(process.platform === 'linux')(
      'treats paths differing only in case as the same file',
      () => {
        createCacheEntry(opossumFilePath);

        const caseVariant =
          opossumFilePath === opossumFilePath.toLowerCase()
            ? opossumFilePath.toUpperCase()
            : opossumFilePath.toLowerCase();
        expect(touchAndGetFreshCacheEntry(caseVariant)).toBeDefined();
      },
    );

    it('invalidates the entry when the file changes', () => {
      createCacheEntry(opossumFilePath);
      expect(touchAndGetFreshCacheEntry(opossumFilePath)).toBeDefined();

      writeTestFile(opossumFilePath, 'changed content with another size');

      expect(touchAndGetFreshCacheEntry(opossumFilePath)).toBeUndefined();
    });

    it('records the current schema version in the meta data', () => {
      const { entryDir } = createCacheEntry(opossumFilePath);

      const metaPath = path.join(entryDir, 'meta.json');
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as {
        schemaVersion: string;
      };
      expect(typeof meta.schemaVersion).toBe('string');
      expect(meta.schemaVersion.length).toBeGreaterThan(0);
      // A real fingerprint is computed from the repository sources; 'unknown'
      // is only the fallback for unreadable sources.
      expect(meta.schemaVersion).not.toBe('unknown');
    });

    it('invalidates entries with an unknown schema version', () => {
      const { entryDir } = createCacheEntry(opossumFilePath);

      const metaPath = path.join(entryDir, 'meta.json');
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as {
        schemaVersion: string;
      };
      meta.schemaVersion = 'outdated-schema';
      fs.writeFileSync(metaPath, JSON.stringify(meta));

      expect(touchAndGetFreshCacheEntry(opossumFilePath)).toBeUndefined();
    });

    it('keeps the entry fresh after a save rewrote the file', () => {
      createCacheEntry(opossumFilePath);

      writeTestFile(opossumFilePath, 'rewritten by save');
      refreshStatsAfterSave(opossumFilePath);

      expect(touchAndGetFreshCacheEntry(opossumFilePath)).toBeDefined();
    });

    it('invalidating the entry prevents restoring the stale database', () => {
      createCacheEntry(opossumFilePath);
      // A split destination is overwritten with content that does not match
      // the cached database.
      writeTestFile(opossumFilePath, 'overwritten by split');
      refreshStatsAfterSave(opossumFilePath);

      invalidateCacheEntry(opossumFilePath);

      expect(touchAndGetFreshCacheEntry(opossumFilePath)).toBeUndefined();
    });

    it('invalidating without an existing entry is a no-op', () => {
      expect(() => invalidateCacheEntry(opossumFilePath)).not.toThrow();
      expect(fs.existsSync(cacheDir)).toBe(false);
    });

    it('does not restore entries without a database file', () => {
      writeCacheMeta(opossumFilePath, { projectId: 'project-id' });

      expect(touchAndGetFreshCacheEntry(opossumFilePath)).toBeUndefined();
    });

    it('prunes old cache entries, keeping the most recently accessed', () => {
      // Deterministic access times make the eviction order predictable.
      let currentTime = 1000;
      vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

      // Creating seven entries prunes down to the five most recent ones.
      const oldFilePaths = Array.from({ length: 7 }, () =>
        faker.outputPath(`${faker.string.uuid()}.opossum`),
      );
      for (const filePath of oldFilePaths) {
        currentTime += 1000;
        writeTestFile(filePath, 'opossum file content');
        createCacheEntry(filePath);
      }

      // Touch the two oldest surviving entries so they become the most
      // recently used, despite their old creation times.
      currentTime += 1000;
      touchAndGetFreshCacheEntry(oldFilePaths[2]);
      currentTime += 1000;
      touchAndGetFreshCacheEntry(oldFilePaths[3]);

      // Adding entries triggers pruning down to the maximum of five entries.
      const newFilePaths = [
        faker.outputPath(`${faker.string.uuid()}.opossum`),
        faker.outputPath(`${faker.string.uuid()}.opossum`),
      ];
      for (const filePath of newFilePaths) {
        currentTime += 1000;
        writeTestFile(filePath, 'opossum file content');
        createCacheEntry(filePath);
      }

      const survivors = [
        ...oldFilePaths.slice(2, 4),
        oldFilePaths[6],
        ...newFilePaths,
      ];
      for (const filePath of survivors) {
        expect(touchAndGetFreshCacheEntry(filePath)).toBeDefined();
      }
      for (const filePath of oldFilePaths.slice(4, 6)) {
        expect(touchAndGetFreshCacheEntry(filePath)).toBeUndefined();
      }
    });

    it('refreshing stats without a cache entry is a no-op', () => {
      writeTestFile(opossumFilePath, 'changed content');

      expect(() => refreshStatsAfterSave(opossumFilePath)).not.toThrow();
      expect(fs.existsSync(cacheDir)).toBe(false);
    });

    it('records an unknown schema version when the sources are unreadable', async () => {
      // A fresh module instance is needed because the schema version is
      // memoized per module instance.
      vi.resetModules();
      vi.spyOn(process, 'cwd').mockReturnValue(
        path.join(cacheDir, 'does-not-exist'),
      );

      const freshCache = await import('../dev-db-cache');
      const dbPath = freshCache.prepareCacheEntry(opossumFilePath);
      expect(dbPath).toBeDefined();
      fs.writeFileSync(dbPath as string, 'db content');
      freshCache.writeCacheMeta(opossumFilePath, { projectId: 'project-id' });

      const entry = freshCache.touchAndGetFreshCacheEntry(opossumFilePath);
      expect(entry?.meta.schemaVersion).toBe('unknown');
    });
  });

  describe('last loaded file', () => {
    it('round-trips the last file', () => {
      process.env.OPOSSUM_DEV_MODE = '1';

      setLastDevFile(opossumFilePath);
      expect(getLastDevFile()).toBe(path.resolve(opossumFilePath));
    });

    it('is not written when the cache is disabled', () => {
      setLastDevFile(opossumFilePath);
      expect(getLastDevFile()).toBeUndefined();
    });

    it('is not readable when explicitly disabled', () => {
      process.env.OPOSSUM_DEV_MODE = '1';
      setLastDevFile(opossumFilePath);

      process.env.OPOSSUM_DISABLE_DEV_DB_CACHE = '1';
      expect(getLastDevFile()).toBeUndefined();
    });
  });

  describe('disabled cache', () => {
    it('does not create cache entries', () => {
      expect(prepareCacheEntry(opossumFilePath)).toBeUndefined();
      writeCacheMeta(opossumFilePath, { projectId: 'project-id' });
      expect(fs.existsSync(cacheDir)).toBe(false);
      expect(touchAndGetFreshCacheEntry(opossumFilePath)).toBeUndefined();
    });
  });
});
