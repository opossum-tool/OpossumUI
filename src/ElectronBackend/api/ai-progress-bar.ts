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

export async function getAiProgressBarData() {
  // Count attribution rows, not links. The correlated EXISTS probes the
  // attribution_uuid/resource_id index and stops at the first writable link.
  // In particular, do not reuse the navigation query: finding the first
  // resource for every attribution unnecessarily expands all resource links.
  const result = await getReviewableAiAttributions()
    .where((eb) => eb.exists(getWritableResourceLinks(eb)))
    .select((eb) => {
      const { deferred, modified, pending } = getAiReviewStatus(eb);
      return [
        eb.fn
          .countAll<number>()
          .filterWhere(eb.and([eb.not(deferred), eb.not(modified)]))
          .as('nonDeferredUnmodified'),
        eb.fn
          .countAll<number>()
          .filterWhere(eb.and([eb.not(deferred), modified]))
          .as('nonDeferredModified'),
        eb.fn
          .countAll<number>()
          .filterWhere(eb.and([deferred, modified]))
          .as('deferredModified'),
        eb.fn.countAll<number>().filterWhere(pending).as('deferredUnmodified'),
      ];
    })
    .executeTakeFirstOrThrow();
  return { result };
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
