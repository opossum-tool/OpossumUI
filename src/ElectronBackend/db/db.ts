// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import BetterSqlite3 from 'better-sqlite3';
import fs from 'fs';
import { Kysely, SqliteDialect } from 'kysely';

import { DB } from './generated/databaseTypes';

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

  const dialect = new SqliteDialect({ database: rawDb });
  return new Kysely<DB>({
    dialect,
    log: process.env.DEBUG ? ['query', 'error'] : [],
  });
}

export function resetDb() {
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
