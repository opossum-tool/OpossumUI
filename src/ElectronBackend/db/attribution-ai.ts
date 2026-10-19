// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Transaction } from 'kysely';

import {
  type AttributionContent,
  getEffectiveHumanModified,
} from '../../shared/attribution-comparison';
import {
  ATTRIBUTION_CONTENT_COLUMNS,
  attributionContentFromRow,
} from './attributionData';
import type { DB } from './generated/databaseTypes';

export async function copyAttributionAi(
  trx: Transaction<DB>,
  sourceUuid: string,
  targetUuid: string,
) {
  await trx
    .insertInto('attribution_ai')
    .columns(['attribution_uuid', 'additional_data', 'human_modified'])
    .expression((eb) =>
      eb
        .selectFrom('attribution_ai')
        .select([
          eb.val(targetUuid).as('attribution_uuid'),
          'additional_data',
          'human_modified',
        ])
        .where('attribution_uuid', '=', sourceUuid),
    )
    .execute();
}

export async function createAttributionAiFromSource(
  trx: Transaction<DB>,
  sourceUuid: string,
  target: AttributionContent & { id: string },
) {
  const source = await trx
    .selectFrom('attribution')
    .innerJoin(
      'attribution_ai',
      'attribution.uuid',
      'attribution_ai.attribution_uuid',
    )
    .select(ATTRIBUTION_CONTENT_COLUMNS)
    .select([
      'attribution_ai.additional_data as ai_additional_data',
      'attribution_ai.human_modified',
    ])
    .where('attribution.uuid', '=', sourceUuid)
    .executeTakeFirst();

  if (!source) {
    return;
  }

  const humanModified = getEffectiveHumanModified(
    attributionContentFromRow(source),
    target,
    source.human_modified === null ? undefined : Boolean(source.human_modified),
  );
  await trx
    .insertInto('attribution_ai')
    .values({
      attribution_uuid: target.id,
      additional_data: source.ai_additional_data,
      human_modified:
        humanModified === undefined ? null : Number(humanModified),
    })
    .execute();
}

export async function updateAttributionAiHumanModified(
  trx: Transaction<DB>,
  attributionUuid: string,
  humanModified: boolean | undefined,
) {
  await trx
    .updateTable('attribution_ai')
    .set(
      'human_modified',
      humanModified === undefined ? null : Number(humanModified),
    )
    .where('attribution_uuid', '=', attributionUuid)
    .execute();
}
