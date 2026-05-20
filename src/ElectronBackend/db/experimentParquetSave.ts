// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';
import fs from 'fs';

import { type OpossumOutputFile } from '../types/types';

export async function writeOutputFileAsParquetDir({
  outputFile,
  parquetDir,
}: {
  outputFile: OpossumOutputFile;
  parquetDir: string;
}): Promise<void> {
  fs.rmSync(parquetDir, { recursive: true, force: true });
  fs.mkdirSync(parquetDir, { recursive: true });

  const instance = await DuckDBInstance.create(':memory:');
  const connection = await instance.connect();

  const start = performance.now();
  try {
    await writeMetadata(connection, outputFile.metadata, parquetDir);
    await writeManualAttributions(
      connection,
      outputFile.manualAttributions,
      parquetDir,
    );
    await writeResourcesToAttributions(
      connection,
      outputFile.resourcesToAttributions,
      parquetDir,
    );
    await writeResolvedExternalAttributions(
      connection,
      outputFile.resolvedExternalAttributions,
      parquetDir,
    );
  } finally {
    connection.disconnectSync();
  }
  const ms = (performance.now() - start).toFixed(1);
  console.log(`  [parquet] total: ${ms} ms`);
}

async function writeMetadata(
  connection: DuckDBConnection,
  metadata: OpossumOutputFile['metadata'],
  parquetDir: string,
): Promise<void> {
  const start = performance.now();
  await connection.run(
    `CREATE TABLE metadata (project_id VARCHAR, file_creation_date VARCHAR, input_file_md5_checksum VARCHAR)`,
  );
  const appender = await connection.createAppender('metadata');
  appender.appendVarchar(metadata.projectId);
  appender.appendVarchar(metadata.fileCreationDate);
  if (metadata.inputFileMD5Checksum === undefined) {
    appender.appendNull();
  } else {
    appender.appendVarchar(metadata.inputFileMD5Checksum);
  }
  appender.endRow();
  appender.closeSync();
  await copyToParquet(connection, 'metadata', `${parquetDir}/metadata.parquet`);
  logTable('metadata', 1, start);
}

async function writeManualAttributions(
  connection: DuckDBConnection,
  manualAttributions: OpossumOutputFile['manualAttributions'],
  parquetDir: string,
): Promise<void> {
  const start = performance.now();
  await connection.run(
    `CREATE TABLE manual_attributions (uuid VARCHAR, data VARCHAR)`,
  );
  const appender = await connection.createAppender('manual_attributions');
  let rows = 0;
  for (const [uuid, attribution] of Object.entries(manualAttributions)) {
    appender.appendVarchar(uuid);
    appender.appendVarchar(JSON.stringify(attribution));
    appender.endRow();
    rows++;
  }
  appender.closeSync();
  await copyToParquet(
    connection,
    'manual_attributions',
    `${parquetDir}/manualAttributions.parquet`,
  );
  logTable('manualAttributions', rows, start);
}

async function writeResourcesToAttributions(
  connection: DuckDBConnection,
  resourcesToAttributions: OpossumOutputFile['resourcesToAttributions'],
  parquetDir: string,
): Promise<void> {
  const start = performance.now();
  await connection.run(
    `CREATE TABLE resources_to_attributions (path VARCHAR, attribution_uuid VARCHAR)`,
  );
  const appender = await connection.createAppender(
    'resources_to_attributions',
  );
  let rows = 0;
  for (const [path, uuids] of Object.entries(resourcesToAttributions)) {
    for (const uuid of uuids) {
      appender.appendVarchar(path);
      appender.appendVarchar(uuid);
      appender.endRow();
      rows++;
    }
  }
  appender.closeSync();
  await copyToParquet(
    connection,
    'resources_to_attributions',
    `${parquetDir}/resourcesToAttributions.parquet`,
  );
  logTable('resourcesToAttributions', rows, start);
}

async function writeResolvedExternalAttributions(
  connection: DuckDBConnection,
  resolvedExternalAttributions: OpossumOutputFile['resolvedExternalAttributions'],
  parquetDir: string,
): Promise<void> {
  const start = performance.now();
  await connection.run(
    `CREATE TABLE resolved_external_attributions (uuid VARCHAR)`,
  );
  const appender = await connection.createAppender(
    'resolved_external_attributions',
  );
  let rows = 0;
  for (const uuid of resolvedExternalAttributions) {
    appender.appendVarchar(uuid);
    appender.endRow();
    rows++;
  }
  appender.closeSync();
  await copyToParquet(
    connection,
    'resolved_external_attributions',
    `${parquetDir}/resolvedExternalAttributions.parquet`,
  );
  logTable('resolvedExternalAttributions', rows, start);
}

async function copyToParquet(
  connection: DuckDBConnection,
  table: string,
  outPath: string,
): Promise<void> {
  await connection.run(
    `COPY "${table}" TO '${outPath}' (FORMAT PARQUET, COMPRESSION UNCOMPRESSED)`,
  );
}

function logTable(name: string, rows: number, startMs: number): void {
  const ms = (performance.now() - startMs).toFixed(1);
  console.log(`    [parquet] ${name}: ${rows} rows in ${ms} ms`);
}
