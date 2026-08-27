// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type {
  AttributionResultSetCriteria,
  SortOption,
} from '../../shared/attribution-result-set';
import type { Relation } from '../../shared/shared-types';
import { backend } from './backendClient';
import { useAttributionPages } from './use-attribution-pages';

export function useAuditAttributionsList({
  criteria,
  relation,
  sort,
  includeReadonly,
  targetAttributionUuid,
}: {
  criteria: AttributionResultSetCriteria;
  relation: Relation;
  sort: SortOption;
  includeReadonly: boolean;
  targetAttributionUuid?: string;
}) {
  const pages = useAttributionPages({
    criteria,
    scope: { mode: 'relation', relation },
    sort,
    includeReadonly,
    targetAttributionUuid,
    navigationScope: 'targetRelation',
  });
  const relationCountsQuery =
    backend.listAttributionRelationCounts.useQuery(criteria);

  return {
    ...pages,
    relationCounts: relationCountsQuery.data,
  };
}
