// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { RawBuilder } from 'kysely';

import type { AttributionSelection } from '../../shared/attribution-selection';
import { getDb } from '../db/db';
import { jsonArraySelection } from '../db/json-array-selection';
import {
  applyExcludedAttributionUuids,
  getAttributionResultSetContext,
  getAttributionSelectionMembershipQuery,
} from './attributions/attribution-list-query-utils';

/**
 * The attributions a tree is presented for, resolved on the backend so the
 * UUIDs never have to cross the Electron boundary and back. A symbolic
 * query-wide selection materializes to its explicit attribution UUID list
 * (bounded by `maxMembers` when given); `limitExceeded` signals selections
 * too large to materialize, letting callers keep the tree hidden.
 */
export type OnAttribution =
  | { kind: 'explicit'; attributionUuids: Array<string> }
  | { kind: 'limitExceeded' };

export type OnAttributionInput = Array<string> | AttributionSelection;

export async function resolveOnAttribution(
  onAttribution: OnAttributionInput | undefined,
  additionalAttributionUuids: Array<string> = [],
  maxMembers?: number,
): Promise<OnAttribution | undefined> {
  if (onAttribution === undefined && additionalAttributionUuids.length === 0) {
    return undefined;
  }
  const selection: AttributionSelection = Array.isArray(onAttribution)
    ? { mode: 'explicit', attributionUuids: onAttribution }
    : (onAttribution ?? { mode: 'explicit', attributionUuids: [] });

  if (selection.mode === 'explicit') {
    const additional = additionalAttributionUuids.filter(
      (uuid) => !selection.attributionUuids.includes(uuid),
    );
    return {
      kind: 'explicit',
      attributionUuids: [
        ...new Set([...selection.attributionUuids, ...additional]),
      ],
    };
  }

  const membership = await getQueryWideSelectionMembershipUuids(
    selection,
    maxMembers,
  );
  if (membership.limitExceeded) {
    return { kind: 'limitExceeded' };
  }
  // Additional attributions bypass both the query filters and the selection
  // exclusions: they describe UI context (e.g. the replaced attribution in a
  // confirmation popup) that the symbolic selection alone cannot express.
  return {
    kind: 'explicit',
    attributionUuids: [
      ...new Set([
        ...membership.attributionUuids,
        ...additionalAttributionUuids,
      ]),
    ],
  };
}

/**
 * Materialized UUIDs of the writable attributions matching a query-wide
 * selection, minus its exclusions. `limitExceeded` is reported with one extra
 * row beyond the limit, without materializing an arbitrary number of UUIDs.
 */
async function getQueryWideSelectionMembershipUuids(
  selection: AttributionSelection & { mode: 'allMatching' },
  maxMembers: number | undefined,
): Promise<{
  attributionUuids: Array<string>;
  limitExceeded: boolean;
}> {
  return getDb()
    .transaction()
    .execute(async (trx) => {
      const { resource, closestAncestor } =
        await getAttributionResultSetContext(trx, selection.query);
      let membership = applyExcludedAttributionUuids(
        getAttributionSelectionMembershipQuery(
          trx,
          {
            ...selection.query,
            includeReadonly: false,
          },
          resource,
          closestAncestor,
        ),
        selection.excludedAttributionUuids,
      )
        .clearSelect()
        .select('uuid');

      if (maxMembers !== undefined) {
        membership = membership.limit(maxMembers + 1);
      }

      const rows = await membership.execute();

      if (maxMembers !== undefined && rows.length > maxMembers) {
        return { attributionUuids: [], limitExceeded: true };
      }

      return {
        attributionUuids: rows.map((row) => row.uuid),
        limitExceeded: false,
      };
    });
}

/**
 * Serializable representation for stable cache keys.
 */
export function getOnAttributionCacheValue(onAttribution: OnAttribution) {
  return onAttribution;
}

export function getOnAttributionUuidSetExpression(
  onAttribution: OnAttribution,
): RawBuilder<string> {
  return jsonArraySelection(
    onAttribution.kind === 'explicit' ? onAttribution.attributionUuids : [],
  );
}
