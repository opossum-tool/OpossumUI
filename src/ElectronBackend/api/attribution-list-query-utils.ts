// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  expressionBuilder,
  type OperandExpression,
  type SqlBool,
} from 'kysely';

import type {
  AttributionFilterKey,
  AttributionValueFilters,
} from '../../shared/attribution-filters';
import type { DB } from '../db/generated/databaseTypes';
import { EDITABLE_ATTRIBUTION_RESOURCE_ACCESS } from '../types/types';
import {
  getFilterExpression,
  getSearchExpression,
  getValueFilterExpression,
} from './filters';
import {
  attributionToResourceRelationship,
  type ResourceRelationship,
} from './utils';

export type AttributionListFilterProps = {
  external?: boolean;
  filters?: Array<AttributionFilterKey>;
  valueFilters?: AttributionValueFilters;
  search?: string;
  showResolved?: boolean;
  excludeUnrelated?: boolean;
  uuids?: Array<string>;
  includeReadonly?: boolean;
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

export function getAttributionListWhereExpressions(
  props: AttributionListFilterProps,
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

  if (props.external !== undefined) {
    expressions.push(eb('is_external', '=', Number(props.external)));
  }

  if (props.excludeUnrelated) {
    expressions.push(eb(relationship, '!=', 'unrelated'));
  }

  for (const filter of props.filters ?? []) {
    expressions.push(getFilterExpression(filter));
  }

  const valueFilterExpression = getValueFilterExpression(
    props.valueFilters ?? {},
  );
  if (valueFilterExpression) {
    expressions.push(valueFilterExpression);
  }

  if (props.search) {
    expressions.push(getSearchExpression(props.search));
  }

  if (!props.showResolved) {
    expressions.push(eb('is_resolved', '=', 0));
  }

  if (props.uuids) {
    expressions.push(eb('uuid', 'in', props.uuids));
  }

  return expressions;
}
