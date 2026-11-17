// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import BetterSqlite3 from 'better-sqlite3';
import fs from 'fs';
import { Kysely, SqliteDialect } from 'kysely';

import type { DB } from './generated/databaseTypes';

/**
 * Direct DB access for faster bulk imports
 *
 * For large amounts of data, using prepared statements with better-sqlite3 directly
 * can give a ~5x speedup
 *
 * Only use this if you know what you're doing
 */
let rawDb: BetterSqlite3.Database | undefined = undefined;
let db: Kysely<DB> | undefined = undefined;

function openDb() {
  // Empty filename for temporary (not in-memory) db: https://www.sqlite.org/inmemorydb.html#temp_db
  const filename = process.env.DEBUG ? 'dev.db' : '';

  if (filename !== '' && fs.existsSync(filename)) {
    console.log('DEBUG: Deleting previous db file');
    fs.unlinkSync(filename);
  }

  rawDb = new BetterSqlite3(filename);

  rawDb.pragma('foreign_keys = ON');
  rawDb.pragma('page_size = 8192');
  rawDb.pragma('cache_size = 8192');

  const dialect = new SqliteDialect({ database: rawDb });
  return new Kysely<DB>({
    dialect,
    log: process.env.DEBUG ? ['query', 'error'] : [],
  });
}

export async function resetDb() {
  await db?.destroy();
  db = openDb();
}

export function getDb() {
  if (!db) {
    throw new Error('DB not initialized');
  }
  return db;
}

export function getRawDb() {
  if (!rawDb) {
    throw new Error('DB not initialized');
  }
  return rawDb;
}

// Upper bound on rows inspected per table: https://www.sqlite.org/analyze.html#pragma_analysis_limit
const ANALYSIS_LIMIT = 1000;

/**
 * Computes statistics (sqlite_stat1) that help the query planner choose good
 * indexes. The analysis limit keeps this cheap even for very large files, at
 * the cost of slightly approximate statistics, which is fine for planning.
 */
export function analyzeDb(): void {
  const rawDb = getRawDb();
  rawDb.pragma(`analysis_limit = ${ANALYSIS_LIMIT}`);
  rawDb.exec('ANALYZE');
}
