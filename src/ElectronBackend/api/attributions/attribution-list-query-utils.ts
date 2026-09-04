// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  expressionBuilder,
  type Kysely,
  type OperandExpression,
  type SelectQueryBuilder,
  sql,
  type SqlBool,
} from 'kysely';

import type {
  AttributionPageRequest,
  AttributionResultSetCriteria,
} from '../../../shared/attribution-result-set';
import type { Relation } from '../../../shared/shared-types';
import type { DB } from '../../db/generated/databaseTypes';
import { EDITABLE_ATTRIBUTION_RESOURCE_ACCESS } from '../../types/types';
import {
  getFilterExpression,
  getSearchExpression,
  getValueFilterExpression,
} from '../filters';
import {
  attributionToResourceRelationship,
  getClosestAncestorWithManualAttributionsBelowBreakpoint,
  getResourceOrThrow,
  type ResourceRelationship,
} from '../utils';

export type AttributionQuery = SelectQueryBuilder<DB, 'attribution', unknown>;

export type AttributionListQueryProps = AttributionResultSetFilterProps & {
  relation?: Relation;
};

export type PageQueryRow = {
  uuid: string;
  relationship: ResourceRelationship;
  resource_count?: number;
  resource_count_below?: number;
};

export type AttributionResultSetContext = {
  resource: { id: number; max_descendant_id: number } | undefined;
  closestAncestor: number | undefined;
};

export const backendToFrontendRelationship = {
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

export function uuidSelection(uuids: Array<string>) {
  return sql<string>`(
    select value from json_each(${JSON.stringify(uuids)})
  )`;
}

type AttributionResultSetFilterProps = AttributionResultSetCriteria & {
  includeReadonly: boolean;
};

export function getAttributionListRelationshipExpression(
  resource: { id: number; max_descendant_id: number } | undefined,
  ancestorId: number | undefined,
) {
  return attributionToResourceRelationship({
    resource,
    ancestorId,
  }).$castTo<ResourceRelationship>();
}

export async function getAttributionResultSetContext(
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

function getAttributionWhereExpressions(
  props: AttributionResultSetFilterProps,
  resource: { id: number; max_descendant_id: number } | undefined,
  ancestorId: number | undefined,
): Array<OperandExpression<SqlBool>> {
  const eb = expressionBuilder<DB, 'attribution'>();
  const relationship = getAttributionListRelationshipExpression(
    resource,
    ancestorId,
  );
  const expressions: Array<OperandExpression<SqlBool>> = [
    props.includeReadonly && resource
      ? eb.or([
          eb('resource_access', 'in', EDITABLE_ATTRIBUTION_RESOURCE_ACCESS),
          eb(relationship, '!=', 'unrelated'),
        ])
      : eb('resource_access', 'in', EDITABLE_ATTRIBUTION_RESOURCE_ACCESS),
  ];

  expressions.push(eb('is_external', '=', Number(props.external)));

  if (props.excludeUnrelated) {
    expressions.push(eb(relationship, '!=', 'unrelated'));
  }

  for (const filter of props.filters) {
    expressions.push(getFilterExpression(filter));
  }

  const valueFilterExpression = getValueFilterExpression(props.valueFilters);
  if (valueFilterExpression) {
    expressions.push(valueFilterExpression);
  }

  if (props.search) {
    expressions.push(getSearchExpression(props.search));
  }

  if (!props.showResolved) {
    expressions.push(eb('is_resolved', '=', 0));
  }

  return expressions;
}

export function addOrdering(
  query: AttributionQuery,
  props: Pick<AttributionPageRequest, 'sort'>,
): AttributionQuery {
  // The UUID tie-breaker makes offset boundaries stable even when all visible
  // sort fields are equal.
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

export function getFilteredQuery(
  trx: Kysely<DB>,
  props: AttributionListQueryProps,
  resource: { id: number; max_descendant_id: number } | undefined,
  ancestorId: number | undefined,
  selectUuids: boolean,
  includeResourceCounts: boolean,
) {
  const relationship = getAttributionListRelationshipExpression(
    resource,
    ancestorId,
  );
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

export function applyExcludedAttributionUuids(
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

function applyFilters(
  query: AttributionQuery,
  props: AttributionListQueryProps,
  resource: { id: number; max_descendant_id: number } | undefined,
  ancestorId: number | undefined,
): AttributionQuery {
  for (const expression of getAttributionWhereExpressions(
    props,
    resource,
    ancestorId,
  )) {
    query = query.where(expression);
  }

  if (props.relation) {
    query = query.where(
      getAttributionListRelationshipExpression(resource, ancestorId),
      '=',
      frontendToBackendRelationship[props.relation],
    );
  }

  return query;
}
