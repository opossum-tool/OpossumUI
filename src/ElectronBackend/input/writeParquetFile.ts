// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type DuckDBAppender, type DuckDBConnection } from '@duckdb/node-api';
import fs from 'fs';
import os from 'os';
import path from 'path';
import * as tar from 'tar';

import {
  type OpossumOutputFile,
  type ParsedOpossumInputFile,
} from '../types/types';
import { withDuckDB } from '../utils/duckdb';
import {
  INPUT_DIR,
  INPUT_FILES,
  OUTPUT_DIR,
  OUTPUT_FILES,
  TABLE_SCHEMAS,
} from './parquetFormat';

const APPENDER_FLUSH_EVERY = 50_000;

export interface WriteParquetTimings {
  msTotal: number;
  msPerTable: Record<string, number>;
  archiveBytes: number;
}

/**
 * Cache directory for input parquet files keyed by project id. The input is
 * immutable from the user's perspective, so we only build the input parquets
 * once at load time and re-use them on subsequent saves.
 */
function getInputCacheDir(projectId: string): string {
  return path.join(os.tmpdir(), 'opossum-parquet-cache', projectId, INPUT_DIR);
}

function isInputCachePopulated(projectId: string): boolean {
  const dir = getInputCacheDir(projectId);
  return Object.values(INPUT_FILES).every((relPath) =>
    fs.existsSync(
      path.join(dir, path.basename(relPath)),
    ),
  );
}

/**
 * Write input/*.parquet files to the per-project cache. Idempotent: returns
 * existing cache without rewriting if all files are present.
 */
export async function writeInputParquetsToCache(
  projectId: string,
  parsedInput: ParsedOpossumInputFile,
): Promise<{ cacheDir: string; msPerTable: Record<string, number> }> {
  const cacheDir = getInputCacheDir(projectId);
  if (isInputCachePopulated(projectId)) {
    return { cacheDir, msPerTable: {} };
  }
  fs.mkdirSync(cacheDir, { recursive: true });

  const msPerTable = await withDuckDB(async (conn) => {
    const timings: Record<string, number> = {};
    await writeMetadataTable(
      conn,
      cacheDir,
      INPUT_FILES.metadata,
      parsedInput.metadata,
      timings,
    );
    await writeResourcesTable(conn, cacheDir, parsedInput, timings);
    await writeAttributionsTable(
      conn,
      cacheDir,
      INPUT_FILES.externalAttributions,
      parsedInput.externalAttributions,
      timings,
    );
    await writeResourcesToAttributionsTable(
      conn,
      cacheDir,
      INPUT_FILES.resourcesToExternalAttributions,
      parsedInput.resourcesToAttributions,
      timings,
    );
    await writeStringListTable(
      conn,
      cacheDir,
      INPUT_FILES.attributionBreakpoints,
      parsedInput.attributionBreakpoints ?? [],
      timings,
    );
    await writeStringListTable(
      conn,
      cacheDir,
      INPUT_FILES.filesWithChildren,
      parsedInput.filesWithChildren ?? [],
      timings,
    );
    await writeExternalAttributionSourcesTable(
      conn,
      cacheDir,
      parsedInput.externalAttributionSources ?? {},
      timings,
    );
    await writeBaseUrlsForSourcesTable(
      conn,
      cacheDir,
      parsedInput.baseUrlsForSources ?? {},
      timings,
    );
    await writeFrequentLicensesTable(
      conn,
      cacheDir,
      parsedInput.frequentLicenses ?? [],
      timings,
    );
    await writeMetadataTable(
      conn,
      cacheDir,
      INPUT_FILES.config,
      parsedInput.config ?? { classifications: {} },
      timings,
    );
    return timings;
  });

  return { cacheDir, msPerTable };
}

/**
 * Write the .opossum.parquet archive: output/*.parquet + a tar with the
 * cached input/*.parquet files. The input cache MUST have been populated
 * via writeInputParquetsToCache (typically at load time).
 */
export async function writeOpossumParquetFile({
  archivePath,
  projectId,
  outputFile,
}: {
  archivePath: string;
  projectId: string;
  outputFile: OpossumOutputFile;
}): Promise<WriteParquetTimings> {
  const start = performance.now();
  const msPerTable: Record<string, number> = {};

  if (!isInputCachePopulated(projectId)) {
    throw new Error(
      `Input parquet cache for project ${projectId} is missing. Did the load step write it?`,
    );
  }
  const inputCacheDir = getInputCacheDir(projectId);

  const workDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'opossum-parquet-build-'),
  );
  const outputDirInWork = path.join(workDir, OUTPUT_DIR);
  fs.mkdirSync(outputDirInWork, { recursive: true });

  const inputDirInWork = path.join(workDir, INPUT_DIR);
  fs.mkdirSync(inputDirInWork, { recursive: true });
  for (const f of fs.readdirSync(inputCacheDir)) {
    fs.copyFileSync(
      path.join(inputCacheDir, f),
      path.join(inputDirInWork, f),
    );
  }

  await withDuckDB(async (conn) => {
    await writeMetadataTable(
      conn,
      workDir,
      OUTPUT_FILES.metadata,
      outputFile.metadata,
      msPerTable,
    );
    await writeRawAttributionsTable(
      conn,
      workDir,
      OUTPUT_FILES.manualAttributions,
      outputFile.manualAttributions,
      msPerTable,
    );
    await writeResourcesToAttributionsTable(
      conn,
      workDir,
      OUTPUT_FILES.resourcesToAttributions,
      outputFile.resourcesToAttributions,
      msPerTable,
    );
    await writeStringListTable(
      conn,
      workDir,
      OUTPUT_FILES.resolvedExternalAttributions,
      outputFile.resolvedExternalAttributions,
      msPerTable,
    );
  });

  const tStartTar = performance.now();
  await tar.create(
    {
      file: archivePath,
      cwd: workDir,
      gzip: false,
      portable: true,
    },
    [INPUT_DIR, OUTPUT_DIR],
  );
  msPerTable['__tar__'] = performance.now() - tStartTar;

  const stat = fs.statSync(archivePath);

  fs.rmSync(workDir, { recursive: true, force: true });

  return {
    msTotal: performance.now() - start,
    msPerTable,
    archiveBytes: stat.size,
  };
}

// ---------- per-table writers ----------

async function createTempTableAndAppender(
  conn: DuckDBConnection,
  tableName: string,
  columns: ReadonlyArray<string>,
): Promise<DuckDBAppender> {
  await conn.run(`DROP TABLE IF EXISTS ${tableName}`);
  await conn.run(`CREATE TEMP TABLE ${tableName} (${columns.join(', ')})`);
  return conn.createAppender(tableName);
}

async function copyTableToParquet(
  conn: DuckDBConnection,
  tableName: string,
  outFile: string,
): Promise<void> {
  const safePath = outFile.replace(/'/g, "''");
  await conn.run(
    `COPY ${tableName} TO '${safePath}' (FORMAT PARQUET, COMPRESSION ZSTD, COMPRESSION_LEVEL 3)`,
  );
}

function maybeFlush(appender: DuckDBAppender, rows: number): void {
  if (rows > 0 && rows % APPENDER_FLUSH_EVERY === 0) {
    // eslint-disable-next-line @eslint-react/dom-no-flush-sync -- DuckDB appender, not React.
    appender.flushSync();
  }
}

async function writeTableViaAppender(
  conn: DuckDBConnection,
  outDir: string,
  relPath: string,
  appendRows: (appender: DuckDBAppender) => number,
  timings: Record<string, number>,
): Promise<void> {
  const start = performance.now();
  const tableName = `t_${relPath
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .toLowerCase()}`;
  const columns = (TABLE_SCHEMAS as Record<string, ReadonlyArray<string>>)[
    relPath
  ];
  if (!columns) {
    throw new Error(`Unknown table schema for ${relPath}`);
  }
  const appender = await createTempTableAndAppender(conn, tableName, columns);
  appendRows(appender);
  appender.closeSync();
  const absOut = path.join(outDir, relPath);
  fs.mkdirSync(path.dirname(absOut), { recursive: true });
  await copyTableToParquet(conn, tableName, absOut);
  timings[relPath] = performance.now() - start;
}

async function writeMetadataTable(
  conn: DuckDBConnection,
  outDir: string,
  relPath: string,
  data: object,
  timings: Record<string, number>,
): Promise<void> {
  await writeTableViaAppender(
    conn,
    outDir,
    relPath,
    (appender) => {
      appender.appendVarchar(JSON.stringify(data));
      appender.endRow();
      return 1;
    },
    timings,
  );
}

async function writeResourcesTable(
  conn: DuckDBConnection,
  outDir: string,
  parsedInput: ParsedOpossumInputFile,
  timings: Record<string, number>,
): Promise<void> {
  await writeTableViaAppender(
    conn,
    outDir,
    INPUT_FILES.resources,
    (appender) => {
      let count = 0;
      const walk = (node: Record<string, unknown>, prefix: string): void => {
        for (const [name, child] of Object.entries(node)) {
          const childPath = prefix === '' ? name : `${prefix}/${name}`;
          if (child === 1) {
            appender.appendVarchar(childPath);
            appender.appendBoolean(true);
            appender.endRow();
            count += 1;
          } else {
            appender.appendVarchar(childPath);
            appender.appendBoolean(false);
            appender.endRow();
            count += 1;
            walk(child as Record<string, unknown>, childPath);
          }
          maybeFlush(appender, count);
        }
      };
      walk(parsedInput.resources, '');
      return count;
    },
    timings,
  );
}

async function writeAttributionsTable(
  conn: DuckDBConnection,
  outDir: string,
  relPath: string,
  attributions: Record<string, object>,
  timings: Record<string, number>,
): Promise<void> {
  await writeTableViaAppender(
    conn,
    outDir,
    relPath,
    (appender) => {
      let count = 0;
      for (const uuid of Object.keys(attributions)) {
        appender.appendVarchar(uuid);
        appender.appendVarchar(JSON.stringify(attributions[uuid]));
        appender.endRow();
        count += 1;
        maybeFlush(appender, count);
      }
      return count;
    },
    timings,
  );
}

async function writeRawAttributionsTable(
  conn: DuckDBConnection,
  outDir: string,
  relPath: string,
  attributions: Record<string, object>,
  timings: Record<string, number>,
): Promise<void> {
  await writeAttributionsTable(conn, outDir, relPath, attributions, timings);
}

async function writeResourcesToAttributionsTable(
  conn: DuckDBConnection,
  outDir: string,
  relPath: string,
  resourcesToAttributions: Record<string, ReadonlyArray<string>>,
  timings: Record<string, number>,
): Promise<void> {
  await writeTableViaAppender(
    conn,
    outDir,
    relPath,
    (appender) => {
      let count = 0;
      for (const [resourcePath, uuids] of Object.entries(
        resourcesToAttributions,
      )) {
        for (const uuid of uuids) {
          appender.appendVarchar(resourcePath);
          appender.appendVarchar(uuid);
          appender.endRow();
          count += 1;
          maybeFlush(appender, count);
        }
      }
      return count;
    },
    timings,
  );
}

async function writeStringListTable(
  conn: DuckDBConnection,
  outDir: string,
  relPath: string,
  values: ReadonlyArray<string>,
  timings: Record<string, number>,
): Promise<void> {
  await writeTableViaAppender(
    conn,
    outDir,
    relPath,
    (appender) => {
      let count = 0;
      for (const value of values) {
        appender.appendVarchar(value);
        appender.endRow();
        count += 1;
        maybeFlush(appender, count);
      }
      return count;
    },
    timings,
  );
}

async function writeExternalAttributionSourcesTable(
  conn: DuckDBConnection,
  outDir: string,
  sources: Record<
    string,
    { name: string; priority: number; isRelevantForPreferred?: boolean }
  >,
  timings: Record<string, number>,
): Promise<void> {
  await writeTableViaAppender(
    conn,
    outDir,
    INPUT_FILES.externalAttributionSources,
    (appender) => {
      let count = 0;
      for (const [key, source] of Object.entries(sources)) {
        appender.appendVarchar(key);
        appender.appendVarchar(source.name);
        appender.appendInteger(source.priority);
        appender.appendBoolean(Boolean(source.isRelevantForPreferred));
        appender.endRow();
        count += 1;
      }
      return count;
    },
    timings,
  );
}

async function writeBaseUrlsForSourcesTable(
  conn: DuckDBConnection,
  outDir: string,
  baseUrls: Record<string, string | null>,
  timings: Record<string, number>,
): Promise<void> {
  await writeTableViaAppender(
    conn,
    outDir,
    INPUT_FILES.baseUrlsForSources,
    (appender) => {
      let count = 0;
      for (const [path_, url] of Object.entries(baseUrls)) {
        appender.appendVarchar(path_);
        if (url === null) {
          appender.appendNull();
        } else {
          appender.appendVarchar(url);
        }
        appender.endRow();
        count += 1;
      }
      return count;
    },
    timings,
  );
}

async function writeFrequentLicensesTable(
  conn: DuckDBConnection,
  outDir: string,
  licenses: ReadonlyArray<{
    shortName: string;
    fullName: string;
    defaultText: string;
  }>,
  timings: Record<string, number>,
): Promise<void> {
  await writeTableViaAppender(
    conn,
    outDir,
    INPUT_FILES.frequentLicenses,
    (appender) => {
      let count = 0;
      for (const license of licenses) {
        appender.appendVarchar(license.shortName);
        appender.appendVarchar(license.fullName);
        appender.appendVarchar(license.defaultText);
        appender.endRow();
        count += 1;
        maybeFlush(appender, count);
      }
      return count;
    },
    timings,
  );
}
