// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type ExpressionBuilder, sql } from 'kysely';

import { getDb } from '../db/db';
import type { DB } from '../db/generated/databaseTypes';
import { GET_LEGACY_RESOURCE_PATH, getResourceOrThrow } from './utils';

function getReviewableAiAttributions() {
  return getDb()
    .selectFrom('attribution_ai')
    .innerJoin(
      'attribution',
      'attribution.uuid',
      'attribution_ai.attribution_uuid',
    )
    .where('attribution.is_external', '=', 0)
    .where('attribution.is_resolved', '=', 0);
}

function getWritableResourceLinks(
  eb: ExpressionBuilder<DB, 'attribution' | 'attribution_ai'>,
) {
  return eb
    .selectFrom('resource_to_attribution')
    .innerJoin('resource', 'resource.id', 'resource_to_attribution.resource_id')
    .select('resource_to_attribution.resource_id')
    .whereRef(
      'resource_to_attribution.attribution_uuid',
      '=',
      'attribution.uuid',
    )
    .where('resource.is_readonly', '=', 0);
}

function getAiReviewStatus(
  eb: ExpressionBuilder<DB, 'attribution' | 'attribution_ai'>,
) {
  const deferred = eb('attribution_ai.deferred_fields', 'is not', null);
  const modified = eb(
    eb.fn.coalesce('attribution_ai.human_modified', eb.val(0)),
    '=',
    1,
  );
  return {
    deferred,
    modified,
    pending: eb.and([deferred, eb.not(modified)]),
  };
}

export async function hasAiAttributions() {
  const result = Boolean(
    await getDb()
      .selectFrom('attribution_ai')
      .select('attribution_uuid')
      .limit(1)
      .executeTakeFirst(),
  );
  return { result };
}

async function getAiAttributionCounts() {
  // Counts attribution rows, not links: the correlated EXISTS probes the
  // attribution_uuid/resource_id index and stops at the first writable link.
  // Shared by progress bar and statistics: one scan classifies AI states and
  // counts non-AI attributions together.
  const result = await getDb()
    .selectFrom('attribution')
    .leftJoin(
      'attribution_ai',
      'attribution.uuid',
      'attribution_ai.attribution_uuid',
    )
    .where('attribution.is_external', '=', 0)
    .where('attribution.is_resolved', '=', 0)
    .where((eb) => eb.exists(getWritableResourceLinks(eb)))
    .select((eb) => {
      const { deferred, modified } = getAiReviewStatus(eb);
      const aiRow = eb('attribution_ai.attribution_uuid', 'is not', null);
      return [
        eb.fn
          .countAll<number>()
          .filterWhere(eb.and([aiRow, eb.not(deferred), eb.not(modified)]))
          .as('nonDeferredUnmodified'),
        eb.fn
          .countAll<number>()
          .filterWhere(eb.and([aiRow, eb.not(deferred), modified]))
          .as('nonDeferredModified'),
        eb.fn
          .countAll<number>()
          .filterWhere(eb.and([aiRow, deferred, modified]))
          .as('deferredModified'),
        eb.fn
          .countAll<number>()
          .filterWhere(eb.and([aiRow, deferred, eb.not(modified)]))
          .as('deferredUnmodified'),
        eb.fn.countAll<number>().filterWhere(eb.not(aiRow)).as('nonAi'),
      ];
    })
    .executeTakeFirstOrThrow();
  return { result };
}

export async function getAiProgressBarData() {
  const { result } = await getAiAttributionCounts();
  return {
    result: {
      nonDeferredUnmodified: result.nonDeferredUnmodified,
      nonDeferredModified: result.nonDeferredModified,
      deferredModified: result.deferredModified,
      deferredUnmodified: result.deferredUnmodified,
    },
  };
}

export async function aiAttributionStatistics() {
  const { result } = await getAiAttributionCounts();

  return {
    result: [
      {
        name: 'nonDeferredUnmodified' as const,
        count: result.nonDeferredUnmodified,
      },
      {
        name: 'nonDeferredModified' as const,
        count: result.nonDeferredModified,
      },
      {
        name: 'deferredUnmodified' as const,
        count: result.deferredUnmodified,
      },
      { name: 'deferredModified' as const, count: result.deferredModified },
      { name: 'nonAi' as const, count: result.nonAi },
    ],
  };
}

export async function getNextAttributionToReviewForAi({
  selectedResourcePath,
  selectedAttributionUuid,
}: {
  selectedResourcePath: string;
  selectedAttributionUuid: string;
}) {
  const selectedResource = await getResourceOrThrow(
    getDb(),
    selectedResourcePath,
  );
  const target = await getDb()
    // Materialize one anchor per pending attribution. This prevents SQLite
    // from flattening the scalar lookup into the outer sort and repeating it.
    // The ordered, indexed lookup stops at the first writable link, rather
    // than joining and grouping every link of every AI attribution.
    .with(
      (cte) => cte('pending_ai_attributions').materialized(),
      () =>
        getReviewableAiAttributions()
          .where((eb) => getAiReviewStatus(eb).pending)
          .select('attribution.uuid')
          .select((eb) =>
            getWritableResourceLinks(eb)
              .orderBy('resource_to_attribution.resource_id')
              .limit(1)
              .as('resource_id'),
          ),
    )
    .selectFrom((db) =>
      db
        .selectFrom('pending_ai_attributions')
        .where('resource_id', 'is not', null)
        .selectAll()
        .orderBy(
          sql`(resource_id > ${selectedResource.id} OR (resource_id = ${selectedResource.id} AND uuid > ${selectedAttributionUuid}))`,
          'desc',
        )
        .orderBy('resource_id')
        .orderBy('uuid')
        .limit(1)
        .as('next_attribution'),
    )
    .innerJoin('resource', 'resource.id', 'next_attribution.resource_id')
    .select(['uuid as attributionUuid', GET_LEGACY_RESOURCE_PATH])
    .executeTakeFirst();
  return {
    result: target
      ? { attributionUuid: target.attributionUuid, resourcePath: target.path }
      : null,
  };
}
