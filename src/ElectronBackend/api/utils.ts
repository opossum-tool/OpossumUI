// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql, Transaction } from 'kysely';

import { DB } from '../db/generated/databaseTypes';

/**
 * If a resource (R) has the same attributions as its closest ancestor that has attributions (A), we want to delete R's attributions.
 * This function should be called after changing the attributions of a resource R to check whether
 *  - R's attributions should now be deleted because they are equal to A's attributions
 *  - R's descendant's attributions should now be deleted because they are equal to R's
 *  - R's descendant's attributions should now be deleted because R has no attributions anymore, and they are equal to A's attributions
 *
 * The function respects attribution breakpoints, so a resources attributions don't count as redundant if they
 * are equal to their ancestor's, but there is a breakpoint in between.
 */
export async function removeRedundantAttributions(
  trx: Transaction<DB>,
  resourceId: number,
) {
  // Starting at R, we go upwards in the tree until we arrive at an ancestor that has attributions or is a breakpoint
  // We include that ancestor if it is a breakpoint
  const closestAncestorAttributionsResult = await sql<{
    attributions: string;
  }>`
    WITH RECURSIVE parents_up_to_breakpoint_or_with_attribution(parent_id, is_attribution_breakpoint, attributions) AS (
            SELECT parent_id, is_attribution_breakpoint, NULL  -- don't consider attributions of first resource
            FROM resource
            WHERE id = ${resourceId}
        UNION
            SELECT parent.parent_id, parent.is_attribution_breakpoint, (SELECT group_concat(attribution_uuid) FROM resource_to_attribution WHERE resource_id = parent.id)
            FROM resource AS parent
            JOIN parents_up_to_breakpoint_or_with_attribution AS child ON parent.id = child.parent_id
            WHERE child.is_attribution_breakpoint = FALSE AND child.attributions IS NULL
    )
    SELECT attributions FROM parents_up_to_breakpoint_or_with_attribution WHERE attributions IS NOT NULL
    `.execute(trx);

  // Starting at R, we go downwards in the tree until we arrive at a descendant that has attributions or is a breakpoint
  // We do not include that descendant if it is a breakpoint
  const closestDescendantsWithAttributionsResult = await sql<{
    id: number;
    attributions: string;
  }>`
    WITH RECURSIVE descendants_down_to_breakpoint_or_with_attribution(id, attributions) AS (
            SELECT id, NULL  -- don't consider attributions of first resource
            FROM resource
            WHERE id = ${resourceId}
        UNION
            SELECT child.id, (SELECT group_concat(attribution_uuid) FROM resource_to_attribution WHERE resource_id = child.id)
            FROM resource AS child
            JOIN descendants_down_to_breakpoint_or_with_attribution AS parent ON child.parent_id = parent.id
            WHERE child.is_attribution_breakpoint = FALSE AND parent.attributions IS NULL
    )
    SELECT id, attributions FROM descendants_down_to_breakpoint_or_with_attribution WHERE attributions IS NOT NULL
  `.execute(trx);

  const resourceAttributionsResult = await trx
    .selectFrom('resource_to_attribution')
    .select('attribution_uuid')
    .where('resource_id', '=', resourceId)
    .execute();

  const resourceAttributions = new Set(
    resourceAttributionsResult.map((row) => row.attribution_uuid),
  );

  // We want to delete the descendant's attributions if they are equal to THEIR closest ancestor with attributions
  // That is R, except when R has no attributions
  let attributionsToCompareWithDescendants = resourceAttributions;

  // Delete R's attributions if they are equal to A's
  if (closestAncestorAttributionsResult.rows.length === 1) {
    const ancestorAttributions = new Set(
      closestAncestorAttributionsResult.rows[0].attributions.split(','),
    );

    if (
      resourceAttributions.symmetricDifference(ancestorAttributions).size === 0
    ) {
      await trx
        .deleteFrom('resource_to_attribution')
        .where('resource_id', '=', resourceId)
        .execute();
      attributionsToCompareWithDescendants = ancestorAttributions;
    }

    if (resourceAttributions.size === 0) {
      attributionsToCompareWithDescendants = ancestorAttributions;
    }
  }

  // Delete the attributions of R's closest descendants with attributions if they are equal to R's
  // or, if R has no attributions, to A's
  for (const descendantRow of closestDescendantsWithAttributionsResult.rows) {
    const descendantAttributions = new Set(
      descendantRow.attributions.split(','),
    );

    if (
      attributionsToCompareWithDescendants.symmetricDifference(
        descendantAttributions,
      ).size === 0
    ) {
      await trx
        .deleteFrom('resource_to_attribution')
        .where('resource_id', '=', descendantRow.id)
        .execute();
    }
  }
}

export async function getAttributionOrThrow(
  trx: Transaction<DB>,
  attributionUuid: string,
) {
  const attribution = await trx
    .selectFrom('attribution')
    .select('is_external')
    .where('uuid', '=', attributionUuid)
    .executeTakeFirst();

  if (!attribution) {
    throw new Error(`Attribution ${attributionUuid} does not exist.`);
  }

  return attribution;
}

export function removeTrailingSlash(path: string) {
  return path.replace(/\/$/, '');
}

export async function getResourceOrThrow(
  trx: Transaction<DB>,
  resourcePath: string,
) {
  const strippedResourcePath = removeTrailingSlash(resourcePath);

  const resource = await trx
    .selectFrom('resource')
    .select('id')
    .where('path', '=', strippedResourcePath)
    .executeTakeFirst();

  if (!resource) {
    throw new Error(`Resource ${resourcePath} does not exist.`);
  }

  return resource;
}
