// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  expressionBuilder,
  type OperandExpression,
  type SqlBool,
} from 'kysely';

import type { AttributionResultSetCriteria } from '../../shared/attribution-result-set';
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

export type AttributionResultSetFilterProps = AttributionResultSetCriteria & {
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

export function getAttributionWhereExpressions(
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
