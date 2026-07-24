// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SplitInfo } from '../../shared/shared-types';
import { getDb } from './db';

const SPLIT_INFO_SINGLETON = 1;

export async function getSplitInfo(): Promise<SplitInfo | null> {
  const splitInfo = await getDb()
    .selectFrom('split_info')
    .select(['split_id', 'input_sha256'])
    .executeTakeFirst();
  if (!splitInfo) {
    return null;
  }

  const readonlyRules = await getDb()
    .selectFrom('readonly_rule')
    .select(['path', 'readonly'])
    .orderBy('path')
    .execute();
  return {
    splitId: splitInfo.split_id,
    inputSha256: splitInfo.input_sha256,
    readonlyRules: readonlyRules.map((rule) => ({
      path: rule.path,
      readonly: Boolean(rule.readonly),
    })),
  };
}

export async function createSplitInfo(splitInfo: SplitInfo): Promise<void> {
  await getDb()
    .transaction()
    .execute(async (trx) => {
      await trx
        .insertInto('split_info')
        .values({
          singleton: SPLIT_INFO_SINGLETON,
          split_id: splitInfo.splitId,
          input_sha256: splitInfo.inputSha256,
        })
        .execute();
      await insertReadonlyRules(trx, splitInfo.readonlyRules);
    });
}

export async function setReadonlyRules(
  readonlyRules: SplitInfo['readonlyRules'],
): Promise<void> {
  await getDb()
    .transaction()
    .execute(async (trx) => {
      await trx.deleteFrom('readonly_rule').execute();
      await insertReadonlyRules(trx, readonlyRules);
    });
}

export async function deleteSplitInfo(): Promise<void> {
  await getDb()
    .transaction()
    .execute(async (trx) => {
      await trx.deleteFrom('readonly_rule').execute();
      await trx.deleteFrom('split_info').execute();
    });
}

async function insertReadonlyRules(
  trx: ReturnType<typeof getDb>,
  readonlyRules: SplitInfo['readonlyRules'],
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
