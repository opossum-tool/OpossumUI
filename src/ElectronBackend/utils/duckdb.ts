// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';

export async function withDuckDB<T>(
  fn: (connection: DuckDBConnection) => Promise<T>,
): Promise<T> {
  const instance = await DuckDBInstance.create(':memory:');
  const connection = await instance.connect();
  try {
    return await fn(connection);
  } finally {
    connection.closeSync();
    instance.closeSync();
  }
}
