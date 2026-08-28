// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type Kysely, type Selectable, sql } from 'kysely';

import type {
  AttributionNavigationRequest,
  AttributionPageRequest,
  AttributionPreviewRequest,
} from '../../../shared/attribution-result-set';
import type {
  Attributions,
  PackageInfo,
  Relation,
} from '../../../shared/shared-types';
import { packageInfoFromAttributionRow } from '../../db/attributionData';
import { getDb } from '../../db/db';
import type { Attribution, DB } from '../../db/generated/databaseTypes';
import { AttributionResourceAccess } from '../../types/types';
import {
  getClosestAncestorWithManualAttributionsBelowBreakpoint,
  getResourceOrThrow,
} from '../utils';
import {
  addOrdering,
  applyExcludedAttributionUuids,
  backendToFrontendRelationship,
  getAttributionListRelationshipExpression,
  getAttributionResultSetContext,
  getFilteredQuery,
  type PageQueryRow,
  uuidSelection,
} from './attribution-list-query-utils';

const DEFAULT_PAGE_SIZE = 200;

type PageDetailRow = Selectable<Attribution>;

type AttributionPageExecutionProps = AttributionPageRequest & {
  excludedAttributionUuids?: Array<string>;
};

export type AttributionPageResult = {
  attributions: Attributions;
  offset: number;
  limit: number;
  hasNextPage: boolean;
};

export type AttributionNavigationResult =
  | { found: false }
  | {
      found: true;
      targetRelation: Relation;
      prefix: AttributionPageResult;
    };

function toResourceAccess(value: number) {
  return value === AttributionResourceAccess.Mixed
    ? 'mixed'
    : value === AttributionResourceAccess.Readonly
      ? 'readonly'
      : 'writable';
}

function getCount(row: PageQueryRow) {
  if (row.relationship === 'same' || row.relationship === 'ancestor') {
    return undefined;
  }

  if (row.relationship === 'descendant') {
    return row.resource_count_below ?? 0;
  }

  return row.resource_count ?? 0;
}

function toPackageInfo(detail: PageDetailRow, row: PageQueryRow): PackageInfo {
  return {
    ...packageInfoFromAttributionRow(detail),
    resourceAccess: toResourceAccess(detail.resource_access),
    relation: backendToFrontendRelationship[row.relationship],
    count: getCount(row),
  } satisfies PackageInfo;
}

async function hydrateAttributionRows(
  trx: Kysely<DB>,
  rows: Array<PageQueryRow>,
  resource: { id: number; max_descendant_id: number } | undefined,
): Promise<Attributions> {
  const uuids = rows.map((row) => row.uuid);
  if (rows.length === 0) {
    return {};
  }

  const details = await trx
    .selectFrom('attribution')
    .selectAll()
    .where('uuid', 'in', uuidSelection(uuids))
    .execute();
  const detailsByUuid = new Map(details.map((detail) => [detail.uuid, detail]));
  const resourceCounts = await getResourceCounts(trx, uuids, resource);

  return Object.fromEntries(
    rows.flatMap((row) => {
      const detail = detailsByUuid.get(row.uuid);
      if (!detail) {
        return [];
      }
      const counts = resourceCounts.get(row.uuid);
      return [
        [
          row.uuid,
          toPackageInfo(detail, {
            ...row,
            resource_count: counts?.total ?? row.resource_count ?? 0,
            resource_count_below: counts?.below ?? row.resource_count_below,
          }),
        ],
      ];
    }),
  );
}

async function getExplicitAttributionRows(
  trx: Kysely<DB>,
  uuids: Array<string>,
  resource: { id: number; max_descendant_id: number } | undefined,
  ancestorId: number | undefined,
): Promise<Array<PageQueryRow>> {
  const relationship = getAttributionListRelationshipExpression(
    resource,
    ancestorId,
  );
  const rows = await trx
    .selectFrom('attribution')
    .select('uuid')
    .select(relationship.as('relationship'))
    .where('uuid', 'in', uuidSelection(uuids))
    .execute();
  const rowsByUuid = new Map(rows.map((row) => [row.uuid, row]));
  return uuids.flatMap((uuid) => {
    const row = rowsByUuid.get(uuid);
    return row ? [row] : [];
  });
}

export async function hydrateAttributionsByUuid(
  trx: Kysely<DB>,
  uuids: Array<string>,
  resourcePathForRelationships?: string,
): Promise<Attributions> {
  if (!resourcePathForRelationships) {
    const details = await trx
      .selectFrom('attribution')
      .selectAll()
      .where('uuid', 'in', uuidSelection(uuids))
      .execute();
    const detailsByUuid = new Map(
      details.map((detail) => [detail.uuid, detail]),
    );
    return Object.fromEntries(
      uuids.flatMap((uuid) => {
        const detail = detailsByUuid.get(uuid);
        return detail
          ? [
              [
                uuid,
                {
                  ...packageInfoFromAttributionRow(detail),
                  resourceAccess: toResourceAccess(detail.resource_access),
                },
              ],
            ]
          : [];
      }),
    );
  }

  const resource = await getResourceOrThrow(trx, resourcePathForRelationships);
  const closestAncestor =
    await getClosestAncestorWithManualAttributionsBelowBreakpoint(
      trx,
      resource.id,
    );
  const rows = await getExplicitAttributionRows(
    trx,
    uuids,
    resource,
    closestAncestor,
  );
  return hydrateAttributionRows(trx, rows, resource);
}

async function getResourceCounts(
  trx: Kysely<DB>,
  uuids: Array<string>,
  resource: { id: number; max_descendant_id: number } | undefined,
) {
  const rows = await trx
    .selectFrom('resource_to_attribution')
    .select('attribution_uuid')
    .select((eb) => eb.fn.countAll<number>().as('total'))
    .$if(resource !== undefined, (query) =>
      query.select(
        sql<number>`sum(case when resource_id > ${resource!.id} and resource_id <= ${resource!.max_descendant_id} then 1 else 0 end)`.as(
          'below',
        ),
      ),
    )
    .where('attribution_uuid', 'in', uuidSelection(uuids))
    .groupBy('attribution_uuid')
    .execute();

  return new Map(
    rows.map((row) => [
      row.attribution_uuid,
      { total: row.total, below: row.below },
    ]),
  );
}

async function executeScopedPage(
  trx: Kysely<DB>,
  props: AttributionPageExecutionProps,
  resource: { id: number; max_descendant_id: number } | undefined,
  closestAncestor: number | undefined,
): Promise<AttributionPageResult> {
  const relation =
    props.scope.mode === 'relation' ? props.scope.relation : undefined;
  const query = applyExcludedAttributionUuids(
    getFilteredQuery(
      trx,
      { ...props, relation },
      resource,
      closestAncestor,
      true,
      props.sort === 'occurrence',
    ),
    props.excludedAttributionUuids,
  );
  const pageRows = (await addOrdering(query, props)
    .limit(props.limit + 1)
    .offset(props.offset)
    .execute()) as Array<PageQueryRow>;
  const visibleRows = pageRows.slice(0, props.limit);

  return {
    attributions: await hydrateAttributionRows(trx, visibleRows, resource),
    offset: props.offset,
    limit: props.limit,
    hasNextPage: pageRows.length > props.limit,
  };
}

async function executeAttributionPage(
  props: AttributionPageExecutionProps,
): Promise<{ result: AttributionPageResult }> {
  const limit = props.limit > 0 ? props.limit : DEFAULT_PAGE_SIZE;
  const offset = Math.max(0, props.offset);
  const result = await getDb()
    .transaction()
    .execute(async (trx) => {
      const { resource, closestAncestor } =
        await getAttributionResultSetContext(trx, props);
      return executeScopedPage(
        trx,
        { ...props, offset, limit },
        resource,
        closestAncestor,
      );
    });

  return { result };
}

export async function listAttributionsPage(
  props: AttributionPageRequest,
): Promise<{ result: AttributionPageResult }> {
  return executeAttributionPage(props);
}

export async function listAttributionPreview(
  props: AttributionPreviewRequest,
): Promise<{ result: AttributionPageResult }> {
  return executeAttributionPage({
    ...props,
    scope: { mode: 'relation', relation: props.relation },
    sort: 'alphabetically',
    includeReadonly: false,
  });
}

export async function locateAttribution(
  props: AttributionNavigationRequest,
): Promise<{ result: AttributionNavigationResult }> {
  const limit = props.limit > 0 ? props.limit : DEFAULT_PAGE_SIZE;
  const result = await getDb()
    .transaction()
    .execute(async (trx) => {
      const { resource, closestAncestor } =
        await getAttributionResultSetContext(trx, props);
      const allRows = (await addOrdering(
        getFilteredQuery(
          trx,
          { ...props, relation: undefined },
          resource,
          closestAncestor,
          true,
          props.sort === 'occurrence',
        ),
        props,
      ).execute()) as Array<PageQueryRow>;
      const targetIndex = allRows.findIndex(
        (row) => row.uuid === props.targetAttributionUuid,
      );
      if (targetIndex < 0) {
        return { found: false } satisfies AttributionNavigationResult;
      }

      const targetRow = allRows[targetIndex];
      const targetRelation =
        backendToFrontendRelationship[targetRow.relationship];
      const scopedRows =
        props.navigationScope === 'all'
          ? allRows
          : allRows.filter(
              (row) => row.relationship === targetRow.relationship,
            );
      const offset = scopedRows.findIndex(
        (row) => row.uuid === props.targetAttributionUuid,
      );
      const prefixLimit = (Math.floor(offset / limit) + 1) * limit;
      const prefix = await executeScopedPage(
        trx,
        {
          ...props,
          scope:
            props.navigationScope === 'all'
              ? { mode: 'all' }
              : { mode: 'relation', relation: targetRelation },
          offset: 0,
          limit: prefixLimit,
        },
        resource,
        closestAncestor,
      );
      return {
        found: true,
        targetRelation,
        prefix,
      } satisfies AttributionNavigationResult;
    });
  return { result };
}
