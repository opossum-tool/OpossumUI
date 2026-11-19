// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type Kysely, sql } from 'kysely';

import type {
  AllMatchingAttributionSelection,
  AttributionSelection,
} from '../../../shared/attribution-selection';
import { getDb } from '../../db/db';
import type { DB } from '../../db/generated/databaseTypes';
import { jsonArraySelection } from '../../db/json-array-selection';
import {
  AttributionResourceAccess,
  EDITABLE_ATTRIBUTION_RESOURCE_ACCESS,
} from '../../types/types';
import {
  applyExcludedAttributionUuids,
  getAttributionResultSetContext,
  getFilteredQuery,
} from './attribution-list-query-utils';

export type AttributionSelectionSummary = {
  selectedCount: number;
  preSelectedCount: number;
  mixedCount: number;
  writableLinkedResourceCount: number;
  allLinkedToSelectedResource: boolean;
  resolvedCount: number;
  needsReviewCount: number;
  followUpCount: number;
  excludeFromNoticeCount: number;
};

export type GetAttributionSelectionSummaryProps = {
  selection: AttributionSelection;
};

/**
 * Resolve a renderer-side selection inside the database process. In
 * particular, an allMatching selection never requires its UUIDs to cross the
 * Electron boundary.
 */
export async function resolveAttributionSelection(
  trx: Kysely<DB>,
  selection: AttributionSelection,
): Promise<Array<string>> {
  if (selection.mode === 'explicit') {
    return selection.attributionUuids;
  }

  const membership = await getQueryWideSelectionMembershipQuery(trx, selection);
  const rows = await membership.membership.execute();
  return rows.map((row) => (row as { uuid: string }).uuid);
}

type AttributionMembershipQuery = ReturnType<typeof getFilteredQuery>;

function getExplicitSelectionMembershipQuery(
  trx: Kysely<DB>,
  attributionUuids: Array<string>,
): AttributionMembershipQuery {
  return trx
    .selectFrom('attribution')
    .select('uuid')
    .where('resource_access', 'in', EDITABLE_ATTRIBUTION_RESOURCE_ACCESS)
    .where('uuid', 'in', jsonArraySelection(attributionUuids))
    .select((eb) =>
      eb.val('same').as('relationship'),
    ) as AttributionMembershipQuery;
}

async function getQueryWideSelectionMembershipQuery(
  trx: Kysely<DB>,
  selection: AllMatchingAttributionSelection,
): Promise<{
  membership: AttributionMembershipQuery;
  resource: { id: number; max_descendant_id: number } | undefined;
  closestAncestor: number | undefined;
}> {
  const { resource, closestAncestor } = await getAttributionResultSetContext(
    trx,
    selection.query,
  );
  const membership = applyExcludedAttributionUuids(
    getFilteredQuery(
      trx,
      {
        ...selection.query,
        includeReadonly: false,
      },
      resource,
      closestAncestor,
      true,
      false,
    ),
    selection.excludedAttributionUuids,
  ) as AttributionMembershipQuery;
  return { membership, resource, closestAncestor };
}

export type GetAttributionSelectionUuidsProps = {
  selection: AllMatchingAttributionSelection;
  limit: number;
};

export async function getAttributionSelectionUuids(
  props: GetAttributionSelectionUuidsProps,
): Promise<{
  result: { attributionUuids: Array<string>; limitExceeded: boolean };
}> {
  const result = await getDb()
    .transaction()
    .execute(async (trx) => {
      const { membership } = await getQueryWideSelectionMembershipQuery(
        trx,
        props.selection,
      );
      const rows = await membership.limit(props.limit + 1).execute();

      if (rows.length > props.limit) {
        return { attributionUuids: [], limitExceeded: true };
      }

      return {
        attributionUuids: rows.map((row) => (row as { uuid: string }).uuid),
        limitExceeded: false,
      };
    });

  return { result };
}

export async function getAttributionSelectionSummary(
  props: GetAttributionSelectionSummaryProps,
): Promise<{ result: AttributionSelectionSummary }> {
  const result = await getDb()
    .transaction()
    .execute(async (trx) => {
      const { selection } = props;
      if (selection.mode === 'allMatching') {
        const { membership, resource } =
          await getQueryWideSelectionMembershipQuery(trx, selection);
        return computeAttributionSelectionSummary(trx, membership, resource);
      }

      const membership = getExplicitSelectionMembershipQuery(
        trx,
        selection.attributionUuids,
      );
      return computeAttributionSelectionSummary(trx, membership, undefined);
    });

  return { result };
}

async function computeAttributionSelectionSummary(
  trx: Kysely<DB>,
  membershipWithExclusions: AttributionMembershipQuery,
  resource: { id: number; max_descendant_id: number } | undefined,
): Promise<AttributionSelectionSummary> {
  const aggregate = await membershipWithExclusions
    .clearSelect()
    .select([
      sql<number>`count(distinct uuid)`.as('selected_count'),
      sql<number>`sum(pre_selected)`.as('pre_selected_count'),
      sql<number>`sum(case when resource_access = ${AttributionResourceAccess.Mixed} then 1 else 0 end)`.as(
        'mixed_count',
      ),
      sql<number>`sum(is_resolved)`.as('resolved_count'),
      sql<number>`sum(needs_review)`.as('needs_review_count'),
      sql<number>`sum(follow_up)`.as('follow_up_count'),
      sql<number>`sum(exclude_from_notice)`.as('exclude_from_notice_count'),
    ])
    .executeTakeFirstOrThrow();
  const membershipUuids = membershipWithExclusions.clearSelect().select('uuid');

  // CROSS JOIN is intentional here: it prevents SQLite from starting with
  // every writable resource and probing it once per selected attribution.
  // Starting with the filtered selection lets the
  // (attribution_uuid, resource_id) index drive this aggregate instead.
  const resourceAggregate = await trx
    .selectFrom(membershipUuids.as('selected_attribution'))
    .crossJoin('resource_to_attribution as rta')
    .crossJoin('resource as r')
    .select(sql<number>`count(distinct r.id)`.as('writable_resource_count'))
    .whereRef('rta.attribution_uuid', '=', 'selected_attribution.uuid')
    .whereRef('r.id', '=', 'rta.resource_id')
    .where('r.is_readonly', '=', 0)
    .executeTakeFirstOrThrow();
  const linkedToSelectedResource = resource
    ? await trx
        .selectFrom('resource_to_attribution as rta')
        .select(sql<number>`count(distinct rta.attribution_uuid)`.as('count'))
        .where('rta.resource_id', '=', resource.id)
        .where('rta.attribution_uuid', 'in', membershipUuids)
        .executeTakeFirstOrThrow()
    : { count: 0 };

  return {
    selectedCount: aggregate.selected_count ?? 0,
    preSelectedCount: aggregate.pre_selected_count ?? 0,
    mixedCount: aggregate.mixed_count ?? 0,
    writableLinkedResourceCount: resourceAggregate.writable_resource_count ?? 0,
    allLinkedToSelectedResource:
      (aggregate.selected_count ?? 0) > 0 &&
      linkedToSelectedResource.count === aggregate.selected_count,
    resolvedCount: aggregate.resolved_count ?? 0,
    needsReviewCount: aggregate.needs_review_count ?? 0,
    followUpCount: aggregate.follow_up_count ?? 0,
    excludeFromNoticeCount: aggregate.exclude_from_notice_count ?? 0,
  };
}
