// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  CaseWhenBuilder,
  ExpressionBuilder,
  expressionBuilder,
  Kysely,
  sql,
  Transaction,
} from 'kysely';

import { FILTERS } from '../../Frontend/shared-constants';
import { DB } from '../db/generated/databaseTypes';
import { CountsWithTotal, ResourceRelationship } from './queries';

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
  const closestAncestorId =
    await getClosestAncestorWithManualAttributionsBelowBreakpoint(
      trx,
      resourceId,
    );

  // Starting at R, we go downwards in the tree until we arrive at a descendant that has attributions or is a breakpoint
  // We do not include that descendant if it is a breakpoint
  const closestDescendantsWithManualAttributionsResult = await sql<{
    id: number;
    attributions: string;
  }>`
    WITH RECURSIVE descendants_down_to_breakpoint_or_with_manual_attribution(id, attributions) AS (
            SELECT id, NULL  -- don't consider attributions of first resource
            FROM resource
            WHERE id = ${resourceId}
        UNION
            SELECT child.id, (SELECT group_concat(attribution_uuid) FROM resource_to_attribution rta JOIN attribution a ON rta.attribution_uuid = a.uuid WHERE resource_id = child.id AND a.is_external = 0)
            FROM resource AS child
            JOIN descendants_down_to_breakpoint_or_with_manual_attribution AS parent ON child.parent_id = parent.id
            WHERE child.is_attribution_breakpoint = FALSE AND parent.attributions IS NULL
    )
    SELECT id, attributions FROM descendants_down_to_breakpoint_or_with_manual_attribution WHERE attributions IS NOT NULL
  `.execute(trx);

  const resourceAttributionsResult = await getManualAttributions(
    trx,
    resourceId,
  );

  const resourceAttributions = new Set(
    resourceAttributionsResult.map((row) => row.attribution_uuid),
  );

  // We want to delete the descendant's attributions if they are equal to THEIR closest ancestor with attributions
  // That is R, except when R has no attributions
  let attributionsToCompareWithDescendants = resourceAttributions;

  // Delete R's attributions if they are equal to A's
  if (closestAncestorId) {
    const closestAncestorAttributionsResult = await getManualAttributions(
      trx,
      closestAncestorId,
    );

    const ancestorAttributions = new Set(
      closestAncestorAttributionsResult.map((r) => r.attribution_uuid),
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
  for (const descendantRow of closestDescendantsWithManualAttributionsResult.rows) {
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
  dbOrTrx: Kysely<DB>,
  attributionUuid: string,
) {
  const attribution = await dbOrTrx
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
  dbOrTrx: Kysely<DB>,
  resourcePath: string,
) {
  const strippedResourcePath = removeTrailingSlash(resourcePath);

  const resource = await dbOrTrx
    .selectFrom('resource')
    .select(['id', 'max_descendant_id'])
    .where('path', '=', strippedResourcePath)
    .executeTakeFirst();

  if (!resource) {
    throw new Error(`Resource ${resourcePath} does not exist.`);
  }

  return resource;
}

function getManualAttributions(dbOrTrx: Kysely<DB>, resourceId: number) {
  return dbOrTrx
    .selectFrom('resource_to_attribution')
    .innerJoin('attribution', 'attribution.uuid', 'attribution_uuid')
    .select('attribution_uuid')
    .where('resource_id', '=', resourceId)
    .where('attribution.is_external', '=', 0)
    .execute();
}

export async function getClosestAncestorWithManualAttributionsBelowBreakpoint(
  dbOrTrx: Kysely<DB>,
  resourceId: number,
) {
  const ancestorWithAttributions =
    await getClosestAncestorWithManualAttributions(dbOrTrx, resourceId);

  if (!ancestorWithAttributions) {
    return undefined;
  }

  const ancestorWithBreakpoint = await getClosestBreakpointAncestor(
    dbOrTrx,
    resourceId,
  );

  if (
    !ancestorWithBreakpoint ||
    ancestorWithBreakpoint <= ancestorWithAttributions
  ) {
    return ancestorWithAttributions;
  }

  return undefined;
}

async function getClosestAncestorWithManualAttributions(
  dbOrTrx: Kysely<DB>,
  resourceId: number,
): Promise<number | undefined> {
  const result = await dbOrTrx
    .selectFrom('resource')
    .select((eb) => eb.fn.max<number>('id').as('ancestor_id'))
    .where((eb) => isAncestorOf(eb, resourceId))
    .where((eb) =>
      eb.exists(
        eb
          .selectFrom('resource_to_attribution as rta')
          .innerJoin('attribution as a', 'rta.attribution_uuid', 'a.uuid')
          .selectAll()
          .whereRef('resource.id', '=', 'rta.resource_id')
          .where('a.is_external', '=', 0),
      ),
    )
    .executeTakeFirst();

  return result?.ancestor_id;
}

async function getClosestBreakpointAncestor(
  dbOrTrx: Kysely<DB>,
  resourceId: number,
): Promise<number | undefined> {
  const result = await dbOrTrx
    .selectFrom('resource')
    .select((eb) => eb.fn.max<number>('id').as('ancestor_id'))
    .where((eb) => isAncestorOf(eb, resourceId))
    .where('is_attribution_breakpoint', '=', 1)
    .executeTakeFirst();

  return result?.ancestor_id;
}

function isAncestorOf(
  eb: ExpressionBuilder<DB, 'resource'>,
  resourceId: number,
) {
  return eb.and([
    eb('id', '<', resourceId),
    eb('max_descendant_id', '>=', resourceId),
  ]);
}

function isDescendantResourceToAttribution(
  eb: ExpressionBuilder<DB, 'resource_to_attribution'>,
  resource: {
    id: number;
    max_descendant_id: number;
  },
) {
  return eb.and([
    eb('resource_id', '>', resource.id),
    eb('resource_id', '<=', resource.max_descendant_id),
  ]);
}

export function attributionToResourceRelationship(props: {
  resource: { id: number; max_descendant_id: number };
  ancestorId: number | undefined;
}) {
  const eb = expressionBuilder<DB, 'attribution'>();
  let expression: CaseWhenBuilder<
    DB,
    'attribution',
    unknown,
    ResourceRelationship
  > = eb
    .case()
    .when(
      eb.exists(
        eb
          .selectFrom('resource_to_attribution')
          .selectAll()
          .whereRef('attribution_uuid', '=', 'attribution.uuid')
          .where('resource_id', '=', props.resource.id),
      ),
    )
    .then('same');

  if (props.ancestorId) {
    expression = expression
      .when(
        eb.exists(
          eb
            .selectFrom('resource_to_attribution')
            .selectAll()
            .whereRef('attribution_uuid', '=', 'attribution.uuid')
            .where('resource_id', '=', props.ancestorId),
        ),
      )
      .then('ancestor');
  }

  expression = expression
    .when(
      eb.exists(
        eb
          .selectFrom('resource_to_attribution')
          .select(eb.val(1).as('1'))
          .whereRef('attribution_uuid', '=', 'attribution.uuid')
          .where((eb) => isDescendantResourceToAttribution(eb, props.resource)),
      ),
    )
    .then('descendant');

  return expression.else('unrelated').end().as('relationship');
}

export function addFilterCounts(
  counts: Array<CountsWithTotal | undefined>,
): CountsWithTotal {
  const result = Object.fromEntries(
    ['total', ...FILTERS].map((f) => [f, 0]),
  ) as CountsWithTotal;

  for (const sum of counts.filter((s) => s !== undefined)) {
    for (const [k, v] of Object.entries(sum)) {
      result[k as keyof CountsWithTotal] += v;
    }
  }

  return result;
}
