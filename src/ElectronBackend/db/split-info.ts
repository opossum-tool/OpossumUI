// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { ReadonlyRule } from '../../shared/shared-types';
import { getDb } from './db';

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

async function insertReadonlyRules(
  trx: ReturnType<typeof getDb>,
  readonlyRules: Array<ReadonlyRule>,
): Promise<void> {
  if (readonlyRules.length === 0) {
    return;
  }
  await trx
    .insertInto('readonly_rule')
    .values(
      readonlyRules.map((rule) => ({
        path: rule.path,
        readonly: Number(rule.readonly),
      })),
    )
    .execute();
}
