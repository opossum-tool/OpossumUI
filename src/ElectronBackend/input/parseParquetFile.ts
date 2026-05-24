// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type DuckDBConnection } from '@duckdb/node-api';
import fs from 'fs';
import os from 'os';
import path from 'path';
import * as tar from 'tar';

import {
  type BaseUrlsForSources,
  type ExternalAttributionSources,
  type RawAttributions,
  type Resources,
  type ResourcesToAttributions,
} from '../../shared/shared-types';
import {
  type ParsedOpossumInputAndOutput,
  type ParsedOpossumInputFile,
  type ParsedOpossumOutputFile,
  type RawFrequentLicense,
} from '../types/types';
import { withDuckDB } from '../utils/duckdb';
import { INPUT_FILES, OUTPUT_FILES } from './parquetFormat';

export interface ParseParquetResult {
  result: ParsedOpossumInputAndOutput;
  msTotal: number;
  msPerTable: Record<string, number>;
}

export async function parseOpossumParquetFile(
  archivePath: string,
): Promise<ParseParquetResult> {
  const start = performance.now();
  const msPerTable: Record<string, number> = {};

  const workDir = fs.mkdtempSync(
    path.join(os.tmpdir(), 'opossum-parquet-extract-'),
  );

  try {
    const tStartExtract = performance.now();
    await tar.extract({
      file: archivePath,
      cwd: workDir,
    });
    msPerTable['__untar__'] = performance.now() - tStartExtract;

    const { input, output } = await withDuckDB(async (conn) => {
      const input = await loadInput(conn, workDir, msPerTable);
      const output = await loadOutput(conn, workDir, msPerTable);
      return { input, output };
    });

    const inputFileRaw = new TextEncoder().encode(JSON.stringify(input));

    return {
      result: { input, output, inputFileRaw },
      msTotal: performance.now() - start,
      msPerTable,
    };
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

async function loadInput(
  conn: DuckDBConnection,
  workDir: string,
  timings: Record<string, number>,
): Promise<ParsedOpossumInputFile> {
  const metadata = await readJsonBlob(
    conn,
    path.join(workDir, INPUT_FILES.metadata),
    timings,
    INPUT_FILES.metadata,
  );
  const resources = await readResourcesTable(
    conn,
    path.join(workDir, INPUT_FILES.resources),
    timings,
  );
  const externalAttributions = await readAttributionsTable(
    conn,
    path.join(workDir, INPUT_FILES.externalAttributions),
    timings,
    INPUT_FILES.externalAttributions,
  );
  const resourcesToAttributions = await readResourcesToAttributionsTable(
    conn,
    path.join(workDir, INPUT_FILES.resourcesToExternalAttributions),
    timings,
    INPUT_FILES.resourcesToExternalAttributions,
  );
  const attributionBreakpoints = await readStringList(
    conn,
    path.join(workDir, INPUT_FILES.attributionBreakpoints),
    timings,
    INPUT_FILES.attributionBreakpoints,
  );
  const filesWithChildren = await readStringList(
    conn,
    path.join(workDir, INPUT_FILES.filesWithChildren),
    timings,
    INPUT_FILES.filesWithChildren,
  );
  const externalAttributionSources = await readExternalAttributionSources(
    conn,
    path.join(workDir, INPUT_FILES.externalAttributionSources),
    timings,
  );
  const baseUrlsForSources = await readBaseUrlsForSources(
    conn,
    path.join(workDir, INPUT_FILES.baseUrlsForSources),
    timings,
  );
  const frequentLicenses = await readFrequentLicenses(
    conn,
    path.join(workDir, INPUT_FILES.frequentLicenses),
    timings,
  );
  const config = await readJsonBlob(
    conn,
    path.join(workDir, INPUT_FILES.config),
    timings,
    INPUT_FILES.config,
  );

  return {
    metadata: metadata as ParsedOpossumInputFile['metadata'],
    resources,
    config: config as ParsedOpossumInputFile['config'],
    externalAttributions,
    resourcesToAttributions,
    attributionBreakpoints,
    filesWithChildren,
    baseUrlsForSources,
    externalAttributionSources,
    frequentLicenses,
  };
}

async function loadOutput(
  conn: DuckDBConnection,
  workDir: string,
  timings: Record<string, number>,
): Promise<ParsedOpossumOutputFile | null> {
  const metadataFile = path.join(workDir, OUTPUT_FILES.metadata);
  if (!fs.existsSync(metadataFile)) {
    return null;
  }

  const metadata = (await readJsonBlob(
    conn,
    metadataFile,
    timings,
    OUTPUT_FILES.metadata,
  )) as ParsedOpossumOutputFile['metadata'];
  const manualAttributions = await readAttributionsTable(
    conn,
    path.join(workDir, OUTPUT_FILES.manualAttributions),
    timings,
    OUTPUT_FILES.manualAttributions,
  );
  const resourcesToAttributions = await readResourcesToAttributionsTable(
    conn,
    path.join(workDir, OUTPUT_FILES.resourcesToAttributions),
    timings,
    OUTPUT_FILES.resourcesToAttributions,
  );
  const resolvedExternalAttributions = await readStringList(
    conn,
    path.join(workDir, OUTPUT_FILES.resolvedExternalAttributions),
    timings,
    OUTPUT_FILES.resolvedExternalAttributions,
  );

  return {
    metadata,
    manualAttributions,
    resourcesToAttributions,
    resolvedExternalAttributions,
  };
}

// ---------- per-table readers ----------

async function readAllRows(
  conn: DuckDBConnection,
  parquetFile: string,
): Promise<Array<Array<unknown>>> {
  const reader = await conn.runAndReadAll(
    `SELECT * FROM read_parquet('${parquetFile.replace(/'/g, "''")}')`,
  );
  return reader.getRowsJS();
}

async function readJsonBlob(
  conn: DuckDBConnection,
  parquetFile: string,
  timings: Record<string, number>,
  timingKey: string,
): Promise<unknown> {
  const start = performance.now();
  const rows = await readAllRows(conn, parquetFile);
  const json = rows[0]?.[0] as string | undefined;
  timings[timingKey] = performance.now() - start;
  return json ? JSON.parse(json) : {};
}

async function readResourcesTable(
  conn: DuckDBConnection,
  parquetFile: string,
  timings: Record<string, number>,
): Promise<Resources> {
  const start = performance.now();
  const rows = await readAllRows(conn, parquetFile);
  const tree: Resources = {};

  for (const [pathValue, isFile] of rows) {
    if (typeof pathValue !== 'string') {
      continue;
    }
    const parts = pathValue.split('/');
    let cursor: Resources = tree;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const segment = parts[i];
      const next = cursor[segment];
      if (next === undefined || next === 1) {
        const newDir: Resources = {};
        cursor[segment] = newDir;
        cursor = newDir;
      } else {
        cursor = next;
      }
    }
    const leaf = parts[parts.length - 1];
    if (isFile) {
      cursor[leaf] = 1;
    } else if (!(leaf in cursor)) {
      cursor[leaf] = {};
    }
  }

  timings[INPUT_FILES.resources] = performance.now() - start;
  return tree;
}

async function readAttributionsTable(
  conn: DuckDBConnection,
  parquetFile: string,
  timings: Record<string, number>,
  timingKey: string,
): Promise<RawAttributions> {
  const start = performance.now();
  const rows = await readAllRows(conn, parquetFile);
  const out: RawAttributions = {};
  for (const [uuid, data] of rows) {
    if (typeof uuid === 'string' && typeof data === 'string') {
      out[uuid] = JSON.parse(data);
    }
  }
  timings[timingKey] = performance.now() - start;
  return out;
}

async function readResourcesToAttributionsTable(
  conn: DuckDBConnection,
  parquetFile: string,
  timings: Record<string, number>,
  timingKey: string,
): Promise<ResourcesToAttributions> {
  const start = performance.now();
  const rows = await readAllRows(conn, parquetFile);
  const out: ResourcesToAttributions = {};
  for (const [resourcePath, uuid] of rows) {
    if (typeof resourcePath !== 'string' || typeof uuid !== 'string') {
      continue;
    }
    const arr = out[resourcePath];
    if (arr) {
      arr.push(uuid);
    } else {
      out[resourcePath] = [uuid];
    }
  }
  timings[timingKey] = performance.now() - start;
  return out;
}

async function readStringList(
  conn: DuckDBConnection,
  parquetFile: string,
  timings: Record<string, number>,
  timingKey: string,
): Promise<Array<string>> {
  const start = performance.now();
  const rows = await readAllRows(conn, parquetFile);
  const out: Array<string> = [];
  for (const [value] of rows) {
    if (typeof value === 'string') {
      out.push(value);
    }
  }
  timings[timingKey] = performance.now() - start;
  return out;
}

async function readExternalAttributionSources(
  conn: DuckDBConnection,
  parquetFile: string,
  timings: Record<string, number>,
): Promise<ExternalAttributionSources> {
  const start = performance.now();
  const rows = await readAllRows(conn, parquetFile);
  const out: ExternalAttributionSources = {};
  for (const row of rows) {
    const [key, name, priority, isRelevantForPreferred] = row;
    if (typeof key !== 'string' || typeof name !== 'string') {
      continue;
    }
    out[key] = {
      name,
      priority: Number(priority),
      isRelevantForPreferred: Boolean(isRelevantForPreferred),
    };
  }
  timings[INPUT_FILES.externalAttributionSources] = performance.now() - start;
  return out;
}

async function readBaseUrlsForSources(
  conn: DuckDBConnection,
  parquetFile: string,
  timings: Record<string, number>,
): Promise<BaseUrlsForSources> {
  const start = performance.now();
  const rows = await readAllRows(conn, parquetFile);
  const out: BaseUrlsForSources = {};
  for (const [path_, url] of rows) {
    if (typeof path_ !== 'string') {
      continue;
    }
    out[path_] = typeof url === 'string' ? url : null;
  }
  timings[INPUT_FILES.baseUrlsForSources] = performance.now() - start;
  return out;
}

async function readFrequentLicenses(
  conn: DuckDBConnection,
  parquetFile: string,
  timings: Record<string, number>,
): Promise<Array<RawFrequentLicense>> {
  const start = performance.now();
  const rows = await readAllRows(conn, parquetFile);
  const out: Array<RawFrequentLicense> = [];
  for (const [shortName, fullName, defaultText] of rows) {
    if (
      typeof shortName === 'string' &&
      typeof fullName === 'string' &&
      typeof defaultText === 'string'
    ) {
      out.push({ shortName, fullName, defaultText });
    }
  }
  timings[INPUT_FILES.frequentLicenses] = performance.now() - start;
  return out;
}
