// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import BetterSqlite3 from 'better-sqlite3';
import { Kysely, SqliteDialect } from 'kysely';

import { Database } from './dbTypes';

function openDb() {
  // Empty filename for temporary (not in-memory) db: https://www.sqlite.org/inmemorydb.html#temp_db
  const database = new BetterSqlite3('');

  database.pragma('foreign_keys = ON');

  const dialect = new SqliteDialect({ database });
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

let db: Kysely<Database> | undefined = undefined;
