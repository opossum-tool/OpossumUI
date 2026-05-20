import { DuckDBInstance } from '@duckdb/node-api';
import fs from 'fs';

const PARQUET_DIR = 'parquet';
const SQLITE_PATH = 'imported.db';

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

async function main() {
  if (fs.existsSync(SQLITE_PATH)) {
    fs.unlinkSync(SQLITE_PATH);
  }

  const instance = await DuckDBInstance.create(':memory:');
  const connection = await instance.connect();

  await connection.run('INSTALL sqlite');
  await connection.run('LOAD sqlite');
  await connection.run(`ATTACH '${SQLITE_PATH}' AS sqlite_dst (TYPE sqlite)`);

  const totalStart = performance.now();
  for (const table of TABLES) {
    const path = `${PARQUET_DIR}/${table}.parquet`;
    const start = performance.now();
    await connection.run(
      `CREATE TABLE sqlite_dst.${table} AS SELECT * FROM read_parquet('${path}')`,
    );
    const ms = (performance.now() - start).toFixed(1);
    console.log(`Imported ${path} in ${ms} ms`);
  }
  const totalMs = (performance.now() - totalStart).toFixed(1);
  console.log(`Total: ${totalMs} ms`);

  connection.disconnectSync();
}

void main();
