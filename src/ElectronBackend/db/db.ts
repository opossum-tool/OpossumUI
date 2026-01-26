// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import BetterSqlite3 from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';

import { Database } from './dbTypes';

/**
 * Direct DB access for faster bulk imports
 *
 * For large amounts of data, using prepared statements with better-sqlite3 directly
 * can give a ~5x speedup
 */
let rawDb: BetterSqlite3.Database | undefined = undefined;
let db: Kysely<Database> | undefined = undefined;

function openDb() {
  // Empty filename for temporary (not in-memory) db: https://www.sqlite.org/inmemorydb.html#temp_db
  rawDb = new BetterSqlite3('');

  rawDb.pragma('foreign_keys = ON');

  const dialect = new SqliteDialect({ database: rawDb });
  return new Kysely<Database>({ dialect });
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
