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

import type { SortOption } from '../../Frontend/Components/SortButton/useSortingOptions';
import type {
  AttributionFilterKey,
  AttributionValueFilters,
} from '../../shared/attribution-filters';
import type { AttributionSelection } from '../../shared/attribution-selection';
import type {
  Attributions,
  PackageInfo,
  Relation,
} from '../../shared/shared-types';
import { packageInfoFromAttributionRow } from '../db/attributionData';
import { getDb } from '../db/db';
import type { Attribution, DB } from '../db/generated/databaseTypes';
import { AttributionResourceAccess } from '../types/types';
import {
  getAttributionListRelationshipExpression,
  getAttributionListWhereExpressions,
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

export type ListAttributionsPageProps = {
  external?: boolean;
  filters?: Array<AttributionFilterKey>;
  resourcePathForRelationships?: string;
  sort?: SortOption;
  valueFilters?: AttributionValueFilters;
  search?: string;
  showResolved?: boolean;
  excludeUnrelated?: boolean;
  includeReadonly?: boolean;
  relation: Relation;
  excludedAttributionUuids?: Array<string>;
  offset: number;
  limit: number;
};

export type ListAttributionRelationCountsProps = Omit<
  ListAttributionsPageProps,
  'relation' | 'sort' | 'offset' | 'limit' | 'excludedAttributionUuids'
>;

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

  const resource = selection.query.resourcePathForRelationships
    ? await getResourceOrThrow(
        trx,
        selection.query.resourcePathForRelationships,
      )
    : undefined;
  const closestAncestor =
    !selection.query.external && resource
      ? await getClosestAncestorWithManualAttributionsBelowBreakpoint(
          trx,
          resource.id,
        )
      : undefined;
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
type AttributionListQueryProps = Omit<
  ListAttributionsPageProps,
  'relation' | 'offset' | 'limit'
> &
  Partial<Pick<ListAttributionsPageProps, 'offset' | 'limit'>> & {
    relation?: Relation;
    uuids?: Array<string>;
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
    resourceAccess:
      detail.resource_access === AttributionResourceAccess.Mixed
        ? 'mixed'
        : detail.resource_access === AttributionResourceAccess.Readonly
          ? 'readonly'
          : 'writable',
    relation: backendToFrontendRelationship[row.relationship],
    count: getCount(row),
  } satisfies PackageInfo;
}

function addOrdering(
  query: AttributionQuery,
  props: ListAttributionsPageProps,
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
  for (const expression of getAttributionListWhereExpressions(
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
      offset: 0,
      limit: 0,
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
      offset: 0,
      limit: 0,
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
      const resource = props.resourcePathForRelationships
        ? await getResourceOrThrow(trx, props.resourcePathForRelationships)
        : undefined;
      const closestAncestor =
        !props.external && resource
          ? await getClosestAncestorWithManualAttributionsBelowBreakpoint(
              trx,
              resource.id,
            )
          : undefined;
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
      const resource = query?.resourcePathForRelationships
        ? await getResourceOrThrow(trx, query.resourcePathForRelationships)
        : undefined;
      const closestAncestor =
        query && !query.external && resource
          ? await getClosestAncestorWithManualAttributionsBelowBreakpoint(
              trx,
              resource.id,
            )
          : undefined;
      const membership = getFilteredQuery(
        trx,
        {
          ...(query ?? {
            external: undefined,
            filters: [],
            search: '',
            valueFilters: {},
            resourcePathForRelationships: '',
            showResolved: true,
            excludeUnrelated: false,
            relation: undefined,
          }),
          includeReadonly: false,
          uuids:
            props.selection.mode === 'explicit'
              ? props.selection.attributionUuids
              : undefined,
        },
        resource,
        closestAncestor,
        true,
        false,
      );
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

export async function listAttributionsPage(
  props: ListAttributionsPageProps,
): Promise<{
  result: {
    attributions: Attributions;
    offset: number;
    hasNextPage: boolean;
  };
}> {
  const limit = props.limit > 0 ? props.limit : DEFAULT_PAGE_SIZE;
  const offset = Math.max(0, props.offset);

  const result = await getDb()
    .transaction()
    .execute(async (trx) => {
      const resource = props.resourcePathForRelationships
        ? await getResourceOrThrow(trx, props.resourcePathForRelationships)
        : undefined;
      const closestAncestor =
        !props.external && resource
          ? await getClosestAncestorWithManualAttributionsBelowBreakpoint(
              trx,
              resource.id,
            )
          : undefined;

      const pageQuery = applyExcludedAttributionUuids(
        getFilteredQuery(
          trx,
          props,
          resource,
          closestAncestor,
          true,
          props.sort === 'occurrence',
        ),
        props.excludedAttributionUuids,
      );
      const pageRows = (await addOrdering(pageQuery, props)
        .limit(limit + 1)
        .offset(offset)
        .execute()) as Array<PageQueryRow>;

      const hasNextPage = pageRows.length > limit;
      const visibleRows = pageRows.slice(0, limit);
      const visibleUuids = visibleRows.map((row) => row.uuid);
      const details = await trx
        .selectFrom('attribution')
        .selectAll()
        .where('uuid', 'in', uuidSelection(visibleUuids))
        .execute();
      const detailsByUuid = new Map(
        details.map((detail) => [detail.uuid, detail]),
      );
      const resourceCounts = await getResourceCounts(
        trx,
        visibleUuids,
        resource,
      );

      return {
        attributions: Object.fromEntries(
          visibleRows.flatMap((row) => {
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
                  resource_count_below:
                    counts?.below ?? row.resource_count_below,
                }),
              ],
            ];
          }),
        ),
        offset,
        hasNextPage,
      };
    });

  return { result };
}
