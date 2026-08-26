// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type Kysely,
  type Selectable,
  type SelectQueryBuilder,
  sql,
} from 'kysely';

import type {
  AttributionNavigationRequest,
  AttributionPageRequest,
  AttributionPreviewRequest,
  AttributionRelationCountRequest,
  AttributionResultSetCriteria,
  AttributionResultSetScope,
} from '../../shared/attribution-result-set';
import type { AttributionSelection } from '../../shared/attribution-selection';
import type {
  Attributions,
  PackageInfo,
  Relation,
} from '../../shared/shared-types';
import { packageInfoFromAttributionRow } from '../db/attributionData';
import { getDb } from '../db/db';
import type { Attribution, DB } from '../db/generated/databaseTypes';
import {
  AttributionResourceAccess,
  EDITABLE_ATTRIBUTION_RESOURCE_ACCESS,
} from '../types/types';
import {
  type AttributionResultSetFilterProps,
  getAttributionListRelationshipExpression,
  getAttributionResultSetWhereExpressions,
} from './attribution-list-query-utils';
import {
  getClosestAncestorWithManualAttributionsBelowBreakpoint,
  getResourceOrThrow,
  type ResourceRelationship,
} from './utils';

const DEFAULT_PAGE_SIZE = 200;

function uuidSelection(uuids: Array<string>) {
  return sql<string>`(
    select value from json_each(${JSON.stringify(uuids)})
  )`;
}

export type ListAttributionsPageProps = AttributionPageRequest;

export type ListAttributionRelationCountsProps =
  AttributionRelationCountRequest;

export type AttributionRelationCount = {
  visibleCount: number;
  editableCount: number;
};

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

  const { resource, closestAncestor } = await getAttributionResultSetContext(
    trx,
    selection.query,
  );
  const rows = await getFilteredQuery(
    trx,
    {
      ...selection.query,
      includeReadonly: false,
    },
    resource,
    closestAncestor,
    true,
    false,
  ).execute();
  const excluded = new Set(selection.excludedAttributionUuids);
  return rows
    .map((row) => (row as { uuid: string }).uuid)
    .filter((uuid) => !excluded.has(uuid));
}

type PageQueryRow = {
  uuid: string;
  relationship: ResourceRelationship;
  resource_count?: number;
  resource_count_below?: number;
};

type PageDetailRow = Selectable<Attribution>;
type AttributionQuery = SelectQueryBuilder<DB, 'attribution', unknown>;
type AttributionListQueryProps = AttributionResultSetFilterProps & {
  relation?: Relation;
};

type AttributionPageExecutionProps = AttributionResultSetCriteria & {
  scope: AttributionResultSetScope;
  sort: ListAttributionsPageProps['sort'];
  includeReadonly: boolean;
  offset: number;
  limit: number;
  targetAttributionUuid?: string;
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
      offset: number;
      prefix: AttributionPageResult;
    };

type AttributionResultSetContext = {
  resource: { id: number; max_descendant_id: number } | undefined;
  closestAncestor: number | undefined;
};

const backendToFrontendRelationship = {
  same: 'resource',
  descendant: 'children',
  ancestor: 'parents',
  unrelated: 'unrelated',
} as const;

const frontendToBackendRelationship = {
  resource: 'same',
  children: 'descendant',
  parents: 'ancestor',
  unrelated: 'unrelated',
} as const;

function toResourceAccess(value: number) {
  return value === AttributionResourceAccess.Mixed
    ? 'mixed'
    : value === AttributionResourceAccess.Readonly
      ? 'readonly'
      : 'writable';
}

async function getAttributionResultSetContext(
  trx: Kysely<DB>,
  criteria: AttributionResultSetCriteria,
): Promise<AttributionResultSetContext> {
  const resource = criteria.resourcePathForRelationships
    ? await getResourceOrThrow(trx, criteria.resourcePathForRelationships)
    : undefined;
  const closestAncestor =
    !criteria.external && resource
      ? await getClosestAncestorWithManualAttributionsBelowBreakpoint(
          trx,
          resource.id,
        )
      : undefined;
  return { resource, closestAncestor };
}

function relationshipExpression(
  resource: { id: number; max_descendant_id: number } | undefined,
  ancestorId: number | undefined,
) {
  return getAttributionListRelationshipExpression(resource, ancestorId);
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
  if (uuids.length === 0) {
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
  const relationship = relationshipExpression(resource, ancestorId);
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
  if (uuids.length === 0) {
    return {};
  }

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

function addOrdering(
  query: AttributionQuery,
  props: Pick<AttributionPageExecutionProps, 'sort'>,
): AttributionQuery {
  // This helper is intentionally kept in the page query. The UUID tie-breaker
  // makes offset boundaries stable even when all visible sort fields are equal.
  if (props.sort === 'classification') {
    query = query.orderBy(sql.ref('classification'), 'desc');
  } else if (props.sort === 'criticality') {
    query = query.orderBy(sql.ref('criticality'), 'desc');
  } else if (props.sort === 'occurrence') {
    query = query.orderBy(sql.ref('resource_count'), 'desc');
  }

  query = query.orderBy((eb) =>
    eb
      .case()
      .when(sql.ref('first_party'), '=', 1)
      .then(eb.fn<string>('concat', [eb.val('First Party'), 'comment']))
      .else(
        eb.fn<string>('concat', [
          sql.ref('package_name'),
          sql.ref('license_name'),
          sql.ref('copyright'),
          sql.ref('license_text'),
          sql.ref('comment'),
          sql.ref('url'),
        ]),
      )
      .end(),
  );

  return query.orderBy(sql.ref('uuid'), 'asc');
}

function applyFilters(
  query: AttributionQuery,
  props: AttributionListQueryProps,
  resource: { id: number; max_descendant_id: number } | undefined,
  ancestorId: number | undefined,
): AttributionQuery {
  for (const expression of getAttributionResultSetWhereExpressions(
    props,
    resource,
    ancestorId,
  )) {
    query = query.where(expression);
  }

  if (props.relation) {
    query = query.where(
      relationshipExpression(resource, ancestorId),
      '=',
      frontendToBackendRelationship[props.relation],
    );
  }

  return query;
}

function getFilteredQuery(
  trx: Kysely<DB>,
  props: AttributionListQueryProps,
  resource: { id: number; max_descendant_id: number } | undefined,
  ancestorId: number | undefined,
  selectUuids: boolean,
  includeResourceCounts: boolean,
) {
  const relationship = relationshipExpression(resource, ancestorId);
  const query = trx
    .selectFrom('attribution')
    .$if(selectUuids, (qb) => qb.select('uuid'))
    .select(relationship.as('relationship'))
    .$if(includeResourceCounts, (qb) =>
      qb.select((eb) =>
        eb
          .selectFrom('resource_to_attribution')
          .select(eb.fn.countAll<number>().as('count'))
          .whereRef('attribution_uuid', '=', 'uuid')
          .as('resource_count'),
      ),
    )
    .$if(includeResourceCounts && resource !== undefined, (qb) =>
      qb.select((eb) =>
        eb
          .selectFrom('resource_to_attribution')
          .select(eb.fn.countAll<number>().as('count'))
          .whereRef('attribution_uuid', '=', 'uuid')
          .where((eb) =>
            eb.between(
              'resource_id',
              resource!.id,
              resource!.max_descendant_id,
            ),
          )
          .as('resource_count_below'),
      ),
    );

  return applyFilters(query, props, resource, ancestorId) as typeof query;
}

type AttributionMembershipQuery = ReturnType<typeof getFilteredQuery>;

function applyExcludedAttributionUuids(
  query: AttributionQuery,
  excludedAttributionUuids: Array<string> | undefined,
): AttributionQuery {
  return excludedAttributionUuids && excludedAttributionUuids.length > 0
    ? query.where(
        'attribution.uuid',
        'not in',
        uuidSelection(excludedAttributionUuids),
      )
    : query;
}

async function getRelationCounts(
  trx: Kysely<DB>,
  props: ListAttributionRelationCountsProps,
  resource: { id: number; max_descendant_id: number } | undefined,
  closestAncestor: number | undefined,
): Promise<Partial<Record<Relation, AttributionRelationCount>>> {
  const visibleRows = await getFilteredQuery(
    trx,
    {
      ...props,
      relation: undefined,
      includeReadonly: true,
    },
    resource,
    closestAncestor,
    false,
    false,
  )
    .select((eb) => eb.fn.countAll<number>().as('visible_count'))
    .groupBy('relationship')
    .execute();

  const editableRows = await getFilteredQuery(
    trx,
    {
      ...props,
      relation: undefined,
      includeReadonly: false,
    },
    resource,
    closestAncestor,
    false,
    false,
  )
    .select((eb) => eb.fn.countAll<number>().as('editable_count'))
    .groupBy('relationship')
    .execute();
  const editableByRelation = new Map(
    editableRows.map((row) => [
      backendToFrontendRelationship[row.relationship],
      row.editable_count,
    ]),
  );

  return Object.fromEntries(
    visibleRows.map((row) => [
      backendToFrontendRelationship[row.relationship],
      {
        visibleCount: row.visible_count,
        editableCount:
          editableByRelation.get(
            backendToFrontendRelationship[row.relationship],
          ) ?? 0,
      },
    ]),
  );
}

async function getResourceCounts(
  trx: Kysely<DB>,
  uuids: Array<string>,
  resource: { id: number; max_descendant_id: number } | undefined,
) {
  if (uuids.length === 0) {
    return new Map<string, { total: number; below?: number }>();
  }

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

export async function listAttributionRelationCounts(
  props: ListAttributionRelationCountsProps,
): Promise<{
  result: Partial<Record<Relation, AttributionRelationCount>>;
}> {
  const result = await getDb()
    .transaction()
    .execute(async (trx) => {
      const { resource, closestAncestor } =
        await getAttributionResultSetContext(trx, props);
      return getRelationCounts(trx, props, resource, closestAncestor);
    });

  return { result };
}

export async function getAttributionSelectionSummary(
  props: GetAttributionSelectionSummaryProps,
): Promise<{ result: AttributionSelectionSummary }> {
  const result = await getDb()
    .transaction()
    .execute(async (trx) => {
      const query =
        props.selection.mode === 'allMatching'
          ? props.selection.query
          : undefined;
      const { resource, closestAncestor } = query
        ? await getAttributionResultSetContext(trx, query)
        : { resource: undefined, closestAncestor: undefined };
      let membership: AttributionMembershipQuery;
      if (props.selection.mode === 'allMatching') {
        membership = getFilteredQuery(
          trx,
          {
            ...props.selection.query,
            includeReadonly: false,
          },
          resource,
          closestAncestor,
          true,
          false,
        );
      } else {
        membership = trx
          .selectFrom('attribution')
          .selectAll('attribution')
          .where('resource_access', 'in', EDITABLE_ATTRIBUTION_RESOURCE_ACCESS)
          .where('uuid', 'in', uuidSelection(props.selection.attributionUuids))
          .select((eb) =>
            eb.val('same').as('relationship'),
          ) as AttributionMembershipQuery;
      }
      const membershipWithExclusions =
        props.selection.mode === 'allMatching' &&
        props.selection.excludedAttributionUuids.length > 0
          ? membership.where(
              'attribution.uuid',
              'not in',
              sql<string>`(select value from json_each(${JSON.stringify(props.selection.excludedAttributionUuids)}))`,
            )
          : membership;
      const aggregate = await membershipWithExclusions
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
      const membershipUuids = membershipWithExclusions
        .clearSelect()
        .select('uuid');

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
            .select(
              sql<number>`count(distinct rta.attribution_uuid)`.as('count'),
            )
            .where('rta.resource_id', '=', resource.id)
            .where('rta.attribution_uuid', 'in', membershipUuids)
            .executeTakeFirstOrThrow()
        : { count: 0 };

      return {
        selectedCount: aggregate.selected_count ?? 0,
        preSelectedCount: aggregate.pre_selected_count ?? 0,
        mixedCount: aggregate.mixed_count ?? 0,
        writableLinkedResourceCount:
          resourceAggregate.writable_resource_count ?? 0,
        allLinkedToSelectedResource:
          (aggregate.selected_count ?? 0) > 0 &&
          linkedToSelectedResource.count === aggregate.selected_count,
        resolvedCount: aggregate.resolved_count ?? 0,
        needsReviewCount: aggregate.needs_review_count ?? 0,
        followUpCount: aggregate.follow_up_count ?? 0,
        excludeFromNoticeCount: aggregate.exclude_from_notice_count ?? 0,
      };
    });

  return { result };
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
  props: ListAttributionsPageProps,
): Promise<{ result: AttributionPageResult }> {
  const response = await executeAttributionPage(props);
  const { attributions, offset, limit, hasNextPage } = response.result;
  return { result: { attributions, offset, limit, hasNextPage } };
}

export async function listAttributionPreview(
  props: AttributionPreviewRequest,
): Promise<{ result: AttributionPageResult }> {
  const response = await executeAttributionPage({
    ...props,
    scope: { mode: 'relation', relation: props.relation },
    sort: 'alphabetically',
    includeReadonly: false,
  });
  return response;
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
        offset,
        prefix,
      } satisfies AttributionNavigationResult;
    });
  return { result };
}
