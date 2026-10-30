// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type {
  AliasableExpression,
  ExpressionBuilder,
  Kysely,
  Selectable,
  SqlBool,
  Transaction,
} from 'kysely';

import {
  type AttributionContent,
  getEffectiveHumanModified,
} from '../../shared/attribution-comparison';
import type { PackageInfo } from '../../shared/shared-types';
import {
  ATTRIBUTION_CONTENT_COLUMNS,
  attributionContentFromRow,
  packageInfoFromAttributionRow,
} from './attributionData';
import type { Attribution, DB } from './generated/databaseTypes';

export type AttributionWithAiStatus = Selectable<Attribution> & {
  ai_attribution_uuid: string | null;
  ai_human_modified: number | null;
  ai_deferred: SqlBool;
};

/**
 * An attribution is AI-deferred if it has AI metadata with deferred fields
 * (`deferred_fields IS NOT NULL`, so an empty object counts as deferred).
 * Use this in query contexts that do not already join `attribution_ai`;
 * when the join exists, check `deferred_fields` directly (see
 * selectAttributionsWithAiStatus) to avoid the redundant exists subquery.
 * Both places must stay semantically identical.
 */
export function isAiDeferred(
  eb: ExpressionBuilder<DB, 'attribution'>,
): AliasableExpression<SqlBool> {
  return eb.exists(
    eb
      .selectFrom('attribution_ai')
      .select('attribution_uuid')
      .whereRef('attribution_ai.attribution_uuid', '=', 'attribution.uuid')
      .where('deferred_fields', 'is not', null),
  );
}

export function selectAttributionsWithAiStatus(db: Kysely<DB>) {
  return db
    .selectFrom('attribution')
    .leftJoin(
      'attribution_ai',
      'attribution.uuid',
      'attribution_ai.attribution_uuid',
    )
    .selectAll('attribution')
    .select([
      'attribution_ai.attribution_uuid as ai_attribution_uuid',
      'attribution_ai.human_modified as ai_human_modified',
    ])
    .select((eb) =>
      eb('attribution_ai.deferred_fields', 'is not', null).as('ai_deferred'),
    );
}

export function packageInfoWithAiStatusFromRow(
  row: AttributionWithAiStatus,
): PackageInfo {
  return {
    ...packageInfoFromAttributionRow(row),
    ...(row.ai_attribution_uuid === null
      ? {}
      : {
          aiStatus: {
            ...(row.ai_human_modified === null
              ? {}
              : { humanModified: Boolean(row.ai_human_modified) }),
            deferred: Boolean(row.ai_deferred),
          },
        }),
  };
}

export async function copyAttributionAi(
  trx: Transaction<DB>,
  sourceUuid: string,
  targetUuid: string,
) {
  await trx
    .insertInto('attribution_ai')
    .columns([
      'attribution_uuid',
      'additional_data',
      'deferred_fields',
      'human_modified',
    ])
    .expression((eb) =>
      eb
        .selectFrom('attribution_ai')
        .select([
          eb.val(targetUuid).as('attribution_uuid'),
          'additional_data',
          'deferred_fields',
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
      'attribution_ai.deferred_fields',
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
      deferred_fields: source.deferred_fields,
      human_modified:
        humanModified === undefined ? null : Number(humanModified),
    })
    .execute();
}

export async function updateAttributionAiHumanModified(
  trx: Kysely<DB>,
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
