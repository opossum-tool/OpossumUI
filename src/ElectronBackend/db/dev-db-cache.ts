// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Development-only persistence for imported databases.
 *
 * In production the imported SQLite database is a temporary database which is
 * rebuilt from scratch whenever an .opossum file is loaded. During frontend
 * development, backend code changes restart Electron, destroying that database
 * and forcing the developer to sit through the full file import again.
 *
 * This module persists the imported database to a project-local cache folder so
 * that a restart can restore it instantly. It is strictly gated behind a
 * build-time constant and an environment variable:
 *
 * - `process.env.OPOSSUM_DEV_MODE` is replaced by vite at build time
 *   (`vite.config.mts`): `"1"` only for Electron bundles built in development
 *   mode (`yarn start`), `"0"` otherwise. Production bundles therefore cannot
 *   enable the cache, regardless of the host environment.
 * - `OPOSSUM_DISABLE_DEV_DB_CACHE=1` disables the mechanism at runtime (e.g.
 *   for E2E tests, which run unpackaged).
 *
 * Cached databases are only restored if their schema matches the current code:
 * `vite.config.mts` hashes `initializeDb.ts` (which defines the entire schema)
 * at build time and bakes the hash in as `process.env.OPOSSUM_DB_SCHEMA_HASH`.
 * A cache entry recorded with a different hash is treated as stale, so changes
 * to the database schema never silently restore outdated databases.
 *
 * In unbundled contexts (unit tests, tsx scripts) the constants are plain
 * environment variable reads, which fail safe (unset = disabled / hash computed
 * from the source file) and keep the module testable.
 */

const DEV_DB_CACHE_DIR_NAME = '.opossum-dev-cache';
const DB_FILE_NAME = 'db.sqlite';
const META_FILE_NAME = 'meta.json';
const LAST_FILE_NAME = 'last-file.json';
const MAX_NUMBER_OF_CACHE_ENTRIES = 5;
const HASH_LENGTH = 16;

// Path of the schema-defining module relative to the repository root. Used to
// compute the schema version in unbundled contexts (unit tests, tsx scripts);
// in Electron bundles vite bakes the hash in at build time.
const SCHEMA_SOURCE_FILE = 'src/ElectronBackend/db/initializeDb.ts';
const FALLBACK_SCHEMA_VERSION = 'unknown';

const CACHE_DIR_ENV_VAR = 'OPOSSUM_DEV_DB_CACHE_DIR';
const DISABLE_ENV_VAR = 'OPOSSUM_DISABLE_DEV_DB_CACHE';

interface DevDbCacheMeta {
  absolutePath: string;
  size: number;
  mtimeMs: number;
  schemaVersion: string;
  projectId: string;
  projectTitle?: string;
  lastAccessMs?: number;
}

export interface DevDbCacheEntry {
  dbPath: string;
  meta: DevDbCacheMeta;
}

export interface DevDbCacheFinalizeData {
  projectId: string;
  projectTitle?: string;
}

function isDevDbCacheDisabled(): boolean {
  return process.env[DISABLE_ENV_VAR] === '1';
}

/**
 * Whether the dev DB cache is enabled in the current process. The dev-mode
 * constant is baked into Electron bundles at build time and read from the
 * environment in unbundled contexts (tests, scripts).
 */
export function isDevDbCacheEnabled(): boolean {
  return process.env.OPOSSUM_DEV_MODE === '1' && !isDevDbCacheDisabled();
}

let cachedSchemaVersion: string | undefined;

/**
 * A hash that changes whenever the database schema (as defined in
 * `initializeDb.ts`) changes. In Electron bundles the hash is computed at
 * build time by vite; elsewhere it is computed from the source file at
 * runtime.
 */
function getDbSchemaVersion(): string {
  if (cachedSchemaVersion === undefined) {
    const bakedSchemaVersion = process.env.OPOSSUM_DB_SCHEMA_HASH;
    if (bakedSchemaVersion) {
      cachedSchemaVersion = bakedSchemaVersion;
    } else {
      try {
        cachedSchemaVersion = crypto
          .createHash('sha256')
          .update(
            fs.readFileSync(
              path.resolve(process.cwd(), SCHEMA_SOURCE_FILE),
              'utf-8',
            ),
          )
          .digest('hex')
          .slice(0, HASH_LENGTH);
      } catch {
        cachedSchemaVersion = FALLBACK_SCHEMA_VERSION;
      }
    }
  }
  return cachedSchemaVersion;
}

function getCacheRootDir(): string {
  return (
    process.env[CACHE_DIR_ENV_VAR] ??
    path.resolve(process.cwd(), DEV_DB_CACHE_DIR_NAME)
  );
}

/**
 * Normalizes a path for use as a cache key, platform-agnostically:
 *
 * - Separators are converted to forward slashes so that paths recorded on one
 *   platform still match on another (relevant when the cache dir is shared).
 * - Case is folded on Windows and macOS, whose default filesystems (NTFS,
 *   APFS/HFS+) are case-insensitive, so `C:\...`/`c:\...` and `/Users/Foo`/
 *   `/users/foo` map to the same cache entry. Linux is case-sensitive and
 *   keeps its case.
 */
function normalizePath(filePath: string): string {
  const posixPath = path.resolve(filePath).replace(/\\/g, '/');
  const caseInsensitivePlatform =
    process.platform === 'win32' || process.platform === 'darwin';
  return caseInsensitivePlatform ? posixPath.toLowerCase() : posixPath;
}

function getEntryDir(opossumFilePath: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(normalizePath(opossumFilePath))
    .digest('hex')
    .slice(0, HASH_LENGTH);
  return path.join(getCacheRootDir(), hash);
}

function getDbPath(entryDir: string): string {
  return path.join(entryDir, DB_FILE_NAME);
}

function getMetaPath(entryDir: string): string {
  return path.join(entryDir, META_FILE_NAME);
}

function getLastFilePath(): string {
  return path.join(getCacheRootDir(), LAST_FILE_NAME);
}

function readMeta(entryDir: string): DevDbCacheMeta | undefined {
  try {
    return JSON.parse(
      fs.readFileSync(getMetaPath(entryDir), 'utf-8'),
    ) as DevDbCacheMeta;
  } catch {
    return undefined;
  }
}

function statOpossumFile(opossumFilePath: string): fs.Stats | undefined {
  try {
    return fs.statSync(opossumFilePath);
  } catch {
    return undefined;
  }
}

/**
 * Returns the cached database for the given file if a cache entry exists that
 * matches the current file stats (i.e. the .opossum file has not changed since
 * the database was imported) and the current database schema. As a side effect
 * records the access, which keeps the entry from being pruned.
 */
export function touchAndGetFreshCacheEntry(
  opossumFilePath: string,
): DevDbCacheEntry | undefined {
  if (!isDevDbCacheEnabled()) {
    return undefined;
  }
  const entryDir = getEntryDir(opossumFilePath);
  const meta = readMeta(entryDir);
  const dbPath = getDbPath(entryDir);
  if (meta?.schemaVersion !== getDbSchemaVersion()) {
    return undefined;
  }
  if (meta.absolutePath !== normalizePath(opossumFilePath)) {
    return undefined;
  }
  if (!fs.existsSync(dbPath)) {
    return undefined;
  }
  const stats = statOpossumFile(opossumFilePath);
  // Exact comparison is intentional: both values were read with statSync for
  // the same file state, so identical state yields identical values.
  if (meta.size !== stats?.size || meta.mtimeMs !== stats.mtimeMs) {
    return undefined;
  }

  const updatedMeta: DevDbCacheMeta = {
    ...meta,
    lastAccessMs: Date.now(),
  };
  try {
    fs.writeFileSync(getMetaPath(entryDir), JSON.stringify(updatedMeta));
  } catch {
    // Not being able to record the access only affects cache eviction.
  }

  return { dbPath, meta: updatedMeta };
}

/**
 * Clears any existing cache entry for the given file and returns the path at
 * which the freshly imported database should be stored. Returns `undefined`
 * when the dev cache is disabled.
 */
export function prepareCacheEntry(opossumFilePath: string): string | undefined {
  if (!isDevDbCacheEnabled()) {
    return undefined;
  }
  const entryDir = getEntryDir(opossumFilePath);
  try {
    fs.rmSync(entryDir, { recursive: true, force: true });
    fs.mkdirSync(entryDir, { recursive: true });
  } catch {
    return undefined;
  }
  return getDbPath(entryDir);
}

/**
 * Records the metadata for a successfully imported database. The file stats are
 * read at this point so that later modifications of the .opossum file
 * invalidate the cache.
 */
export function writeCacheMeta(
  opossumFilePath: string,
  data: DevDbCacheFinalizeData,
): void {
  if (!isDevDbCacheEnabled()) {
    return;
  }
  const entryDir = getEntryDir(opossumFilePath);
  const stats = statOpossumFile(opossumFilePath);
  if (!stats) {
    return;
  }
  const meta: DevDbCacheMeta = {
    absolutePath: normalizePath(opossumFilePath),
    size: stats.size,
    mtimeMs: stats.mtimeMs,
    schemaVersion: getDbSchemaVersion(),
    projectId: data.projectId,
    projectTitle: data.projectTitle,
    lastAccessMs: Date.now(),
  };
  try {
    fs.mkdirSync(entryDir, { recursive: true });
    fs.writeFileSync(getMetaPath(entryDir), JSON.stringify(meta));
    pruneCacheEntries();
  } catch {
    // A missing or broken cache entry must never break file loading.
  }
}

/**
 * Updates the recorded file stats after a save operation. Saving rewrites the
 * .opossum file, which would otherwise invalidate the cache even though the
 * database still matches the file contents.
 */
export function refreshStatsAfterSave(opossumFilePath: string): void {
  if (!isDevDbCacheEnabled()) {
    return;
  }
  const entryDir = getEntryDir(opossumFilePath);
  const meta = readMeta(entryDir);
  const stats = statOpossumFile(opossumFilePath);
  if (!meta || !stats) {
    return;
  }
  try {
    fs.writeFileSync(
      getMetaPath(entryDir),
      JSON.stringify({
        ...meta,
        size: stats.size,
        mtimeMs: stats.mtimeMs,
        lastAccessMs: Date.now(),
      }),
    );
  } catch {
    // A missing or broken cache entry must never break saving.
  }
}

/**
 * The .opossum file that was loaded last. Only meaningful in development;
 * the main process uses it to reopen the file after a restart.
 */
export function getLastDevFile(): string | undefined {
  if (!isDevDbCacheEnabled()) {
    return undefined;
  }
  try {
    const content = JSON.parse(fs.readFileSync(getLastFilePath(), 'utf-8')) as {
      absolutePath?: unknown;
    };
    return typeof content.absolutePath === 'string'
      ? content.absolutePath
      : undefined;
  } catch {
    return undefined;
  }
}

export function setLastDevFile(opossumFilePath: string): void {
  if (!isDevDbCacheEnabled()) {
    return;
  }
  try {
    fs.mkdirSync(getCacheRootDir(), { recursive: true });
    fs.writeFileSync(
      getLastFilePath(),
      JSON.stringify({ absolutePath: path.resolve(opossumFilePath) }),
    );
  } catch {
    // A missing last-file pointer must never break file loading.
  }
}

function pruneCacheEntries(): void {
  const rootDir = getCacheRootDir();
  if (!fs.existsSync(rootDir)) {
    return;
  }
  let entries: Array<{ dir: string; lastAccessMs: number }>;
  try {
    entries = fs
      .readdirSync(rootDir)
      .map((name) => path.join(rootDir, name))
      .filter((dir) => {
        try {
          return fs.statSync(dir).isDirectory();
        } catch {
          return false;
        }
      })
      .map((dir) => {
        const meta = readMeta(dir);
        let lastAccessMs = meta?.lastAccessMs ?? 0;
        if (!lastAccessMs) {
          try {
            lastAccessMs = fs.statSync(getDbPath(dir)).mtimeMs;
          } catch {
            lastAccessMs = 0;
          }
        }
        return { dir, lastAccessMs };
      });
  } catch {
    return;
  }

  entries.sort((first, second) => first.lastAccessMs - second.lastAccessMs);
  for (const entry of entries.slice(0, -MAX_NUMBER_OF_CACHE_ENTRIES)) {
    try {
      fs.rmSync(entry.dir, { recursive: true, force: true });
    } catch {
      // Failed eviction is harmless.
    }
  }
}
