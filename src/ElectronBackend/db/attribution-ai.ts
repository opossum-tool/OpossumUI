// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Transaction } from 'kysely';

import type { DB } from './generated/databaseTypes';

export async function copyAttributionAi(
  trx: Transaction<DB>,
  sourceUuid: string,
  targetUuid: string,
) {
  await trx
    .insertInto('attribution_ai')
    .columns(['attribution_uuid', 'additional_data'])
    .expression((eb) =>
      eb
        .selectFrom('attribution_ai')
        .select([eb.val(targetUuid).as('attribution_uuid'), 'additional_data'])
        .where('attribution_uuid', '=', sourceUuid),
    )
    .execute();
}
