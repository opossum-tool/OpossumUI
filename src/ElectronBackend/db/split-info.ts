// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Kysely, Transaction } from 'kysely';

import type { ReadonlyRule } from '../../shared/shared-types';
import { withSqlBatching } from '../api/utils';
import { getDb } from './db';
import type { DB } from './generated/databaseTypes';

export async function isProjectSplit(): Promise<boolean> {
  const result = await getDb()
    .selectFrom('readonly_rule')
    .select('path')
    .limit(1)
    .executeTakeFirst();
  return result !== undefined;
}

export async function getReadonlyRules(): Promise<Array<ReadonlyRule>> {
  const readonlyRules = await getDb()
    .selectFrom('readonly_rule')
    .select(['path', 'readonly'])
    .orderBy('path')
    .execute();
  return readonlyRules.map((rule) => ({
    path: rule.path,
    readonly: Boolean(rule.readonly),
  }));
}

export async function replaceReadonlyRules(
  readonlyRules: Array<ReadonlyRule>,
): Promise<void> {
  await getDb()
    .transaction()
    .execute(async (trx) => {
      await trx.deleteFrom('readonly_rule').execute();
      await insertReadonlyRules(trx, readonlyRules);
    });
}

export async function insertReadonlyRules(
  trx: Kysely<DB> | Transaction<DB>,
  readonlyRules: Array<ReadonlyRule>,
): Promise<void> {
  await withSqlBatching(
    readonlyRules,
    async (batch) => {
      await trx
        .insertInto('readonly_rule')
        .values(
          batch.map((rule) => ({
            path: rule.path,
            readonly: Number(rule.readonly),
          })),
        )
        .execute();
    },
    { parametersPerItem: 2 },
  );
}
