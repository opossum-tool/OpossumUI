import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';
import fs from 'fs';

const SQLITE_PATH = 'dev.db';
const PARQUET_DIR = 'parquet';

const TABLES = [
  'attribution',
  'classification',
  //'closest_attributed_ancestors',
  'external_attribution_source',
  'frequent_license',
  'resource',
  'resource_to_attribution',
  'source_for_attribution',
] as const;

async function writeTable(connection: DuckDBConnection, table: string) {
  const path = `${PARQUET_DIR}/${table}.parquet`;
  const start = performance.now();
  await connection.run(
    `COPY (SELECT * FROM sqlite_src.${table}) TO '${path}' (FORMAT PARQUET, COMPRESSION ZSTD)`,
  );
  const ms = (performance.now() - start).toFixed(1);
  console.log(`Wrote ${path} in ${ms} ms`);
}

async function main() {
  const instance = await DuckDBInstance.create(':memory:');

  fs.rmSync(PARQUET_DIR, { recursive: true, force: true });
  fs.mkdirSync(PARQUET_DIR, { recursive: true });

  // ATTACH is catalog-level on the instance, so do it exactly once.
  const setup = await instance.connect();
  await setup.run('INSTALL sqlite');
  await setup.run('LOAD sqlite');
  await setup.run(
    `ATTACH '${SQLITE_PATH}' AS sqlite_src (TYPE sqlite, READ_ONLY)`,
  );
  setup.disconnectSync();

  // One connection per parallel COPY so they don't serialize on the connection.
  const connections = await Promise.all(
    TABLES.map(() => instance.connect()),
  );

  const totalStart = performance.now();
  await Promise.all(
    TABLES.map((table, i) => writeTable(connections[i], table)),
  );
  const totalMs = (performance.now() - totalStart).toFixed(1);
  console.log(`Total: ${totalMs} ms`);

  for (const connection of connections) {
    connection.disconnectSync();
  }
}

void main();
