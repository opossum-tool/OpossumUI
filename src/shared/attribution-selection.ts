// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type {
  AttributionFilterKey,
  AttributionValueFilters,
} from './attribution-filters';
import type { Relation } from './shared-types';

/** The part of an attribution-list query that defines its result set. */
export interface AttributionSelectionQuery {
  external: boolean;
  filters: Array<AttributionFilterKey>;
  search: string;
  valueFilters: AttributionValueFilters;
  resourcePathForRelationships: string;
  showResolved: boolean;
  excludeUnrelated: boolean;
  relation: Relation;
}

/** A selection can stay symbolic while the matching rows are paginated. */
export type AttributionSelection =
  | {
      mode: 'explicit';
      attributionUuids: Array<string>;
    }
  | {
      mode: 'allMatching';
      query: AttributionSelectionQuery;
      excludedAttributionUuids: Array<string>;
    };

export function excludeAttributionFromAllMatchingSelection(
  selection: AttributionSelection,
  attributionUuid: string,
): AttributionSelection {
  if (selection.mode === 'explicit') {
    return selection;
  }

  return selection.excludedAttributionUuids.includes(attributionUuid)
    ? selection
    : {
        ...selection,
        excludedAttributionUuids: [
          ...selection.excludedAttributionUuids,
          attributionUuid,
        ],
      };
}
