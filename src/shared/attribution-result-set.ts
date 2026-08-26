// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type {
  AttributionFilterKey,
  AttributionValueFilters,
} from './attribution-filters';
import type { Relation } from './shared-types';

export type SortOption =
  'alphabetically' | 'criticality' | 'occurrence' | 'classification';

/** The criteria shared by every attribution result-set consumer. */
export interface AttributionResultSetCriteria {
  external: boolean;
  filters: Array<AttributionFilterKey>;
  search: string;
  valueFilters: AttributionValueFilters;
  resourcePathForRelationships: string;
  showResolved: boolean;
  excludeUnrelated: boolean;
}

export type AttributionSelectionCriteria = AttributionResultSetCriteria & {
  relation: Relation;
};

export type AttributionResultSetScope =
  { mode: 'all' } | { mode: 'relation'; relation: Relation };

export type AttributionPageRequest = AttributionResultSetCriteria & {
  scope: AttributionResultSetScope;
  sort: SortOption;
  includeReadonly: boolean;
  offset: number;
  limit: number;
};

export type AttributionRelationCountRequest = AttributionResultSetCriteria;

export type AttributionPreviewRequest = AttributionSelectionCriteria & {
  excludedAttributionUuids: Array<string>;
  offset: number;
  limit: number;
};

export type AttributionNavigationRequest = AttributionResultSetCriteria & {
  sort: SortOption;
  includeReadonly: boolean;
  targetAttributionUuid: string;
  limit: number;
  navigationScope: 'all' | 'targetRelation';
};
