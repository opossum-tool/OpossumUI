// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type CaseWhenBuilder,
  type Expression,
  type ExpressionBuilder,
  expressionBuilder,
  type Kysely,
  type RawBuilder,
  sql,
  type Transaction,
} from 'kysely';
import { escapeRegExp, pickBy, snakeCase } from 'lodash';
import { v4 as uuid4 } from 'uuid';

import { FILTERS } from '../../Frontend/shared-constants';
import {
  areAttributionsEqual,
  FORM_ATTRIBUTES,
  thirdPartyKeys,
} from '../../shared/attribution-comparison';
import { type PackageInfo } from '../../shared/shared-types';
import { type DB } from '../db/generated/databaseTypes';
import { removeManualOrExternalCaaFromResources } from './progressBarUtils';
import {
  type FilterProperties,
  type FilterPropertiesWithCanonicalLicenseNames,
} from './queries';

export type ResourceRelationship =
  | 'same'
  | 'ancestor'
  | 'descendant'
  | 'unrelated';

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
  {
    attributionUuids,
    resourceIds,
  }: { attributionUuids?: Array<string>; resourceIds?: Array<number> },
) {
  await withBatching(resourceIds, async (batchedResourceIds) => {
    await trx.schema
      .createTable('duplicate_resources')
      .temporary()
      .as(
        trx
          // The resources given by props, with their max_descendant_id and closest manual ancestor
          .with('changed_resources', (db) =>
            db
              .selectFrom('resource')
              .leftJoin(
                'resource_to_attribution as rta',
                'resource.id',
                'rta.resource_id',
              )
              .leftJoin(
                'closest_attributed_ancestors',
                'resource.id',
                'closest_attributed_ancestors.resource_id',
              )
              .select([
                'resource.id as resource_id',
                'resource.max_descendant_id',
                'closest_attributed_ancestors.manual',
              ])
              .distinct()
              .$if(attributionUuids !== undefined, (eb) =>
                eb.where('rta.attribution_uuid', 'in', attributionUuids!),
              )
              .$if(batchedResourceIds !== undefined, (eb) =>
                eb.where('resource.id', 'in', batchedResourceIds!),
              ),
          )
          // Get the closest ancestor with manual attribution ABOVE each resource
          .with('closest_ancestor_above', (db) =>
            db
              .selectFrom('resource')
              .innerJoin(
                'closest_attributed_ancestors',
                'resource.parent_id',
                'closest_attributed_ancestors.resource_id',
              )
              .select([
                'resource.id as resource_id',
                'closest_attributed_ancestors.manual as ancestor_id',
              ])
              .where('is_attribution_breakpoint', '=', 0),
          )
          // We need to check a resource C if
          .with('resources_to_check', (db) =>
            // - C's attributions were changed
            db
              .selectFrom('changed_resources')
              .select('resource_id')
              .union(
                // - C's closest ancestor was changed
                db
                  .selectFrom('closest_ancestor_above')
                  .select('resource_id')
                  .where('ancestor_id', 'in', (eb) =>
                    eb.selectFrom('changed_resources').select('resource_id'),
                  ),
              )
              .union(
                // - A changed resource R that now has no attributions is between C and C's closest ancestor (excluding itself)
                db
                  .selectFrom('closest_ancestor_above')
                  .select('resource_id')
                  .where((eb) =>
                    eb.exists(
                      // R has no own attributions
                      eb
                        .selectFrom('changed_resources')
                        .selectAll()
                        .whereRef(
                          'changed_resources.resource_id',
                          '!=',
                          'changed_resources.manual',
                        )
                        // R has the same ancestor as C
                        .whereRef(
                          'changed_resources.manual',
                          '=',
                          'closest_ancestor_above.ancestor_id',
                        )
                        // C is a descendant of R
                        .where((eb) =>
                          eb.between(
                            'closest_ancestor_above.resource_id',
                            eb.ref('changed_resources.resource_id'),
                            eb.ref('changed_resources.max_descendant_id'),
                          ),
                        ),
                    ),
                  ),
              ),
          )
          // Get a list of all manual attributions per resource
          .with('attributions_for_resource', (db) =>
            db
              .selectFrom((eb) =>
                eb
                  .selectFrom('resource_to_attribution')
                  .select(['resource_id', 'attribution_uuid'])
                  .where('attribution_is_external', '=', 0)
                  .orderBy('attribution_uuid')
                  .as('ordered_rta'),
              )
              .select([
                'resource_id',
                sql<string>`group_concat(attribution_uuid)`.as('attributions'),
              ])
              .groupBy('resource_id'),
          )
          // Finally check all resources_to_check
          // This would also work if we did this on all resources, it would just be slower
          .selectFrom('closest_ancestor_above')
          .select('resource_id')
          .where('resource_id', 'in', (eb) =>
            eb.selectFrom('resources_to_check').selectAll(),
          )
          .where(
            (eb) =>
              eb
                .selectFrom('attributions_for_resource')
                .select('attributions')
                .whereRef(
                  'attributions_for_resource.resource_id',
                  '=',
                  'closest_ancestor_above.resource_id',
                ),
            '=',
            (eb) =>
              eb
                .selectFrom('attributions_for_resource')
                .select('attributions')
                .whereRef(
                  'attributions_for_resource.resource_id',
                  '=',
                  'closest_ancestor_above.ancestor_id',
                ),
          ),
      )
      .execute();

    await trx
      .withTables<{ duplicate_resources: { resource_id: number } }>()
      .deleteFrom('resource_to_attribution')
      .where('attribution_is_external', '=', 0)
      .where('resource_id', 'in', (eb) =>
        eb
          .selectFrom('duplicate_resources')
          .select('duplicate_resources.resource_id'),
      )
      .execute();

    // In this case, we need to call this function after removing the attribution-resource-connection, because
    // we don't know which attributionUuid will be affected. That means we can't pass the uuids to this function,
    // so they can't be ignored when checking for remaining attributions on the resources.
    await removeManualOrExternalCaaFromResources(trx, 'manual', {
      resourceIds: trx
        .withTables<{ duplicate_resources: { resource_id: number } }>()
        .selectFrom('duplicate_resources')
        .select('resource_id'),
    });

    await trx.schema.dropTable('duplicate_resources').execute();
  });
}

export const GET_LEGACY_RESOURCE_PATH =
  sql<string>`resource.path || IF(resource.can_have_children, '/', '')`.as(
    'path',
  );

export async function getAttributionOrThrow(
  dbOrTrx: Kysely<DB>,
  attributionUuid: string,
  options?: {
    preconditions?: { minimumResources?: number; isExternal?: boolean };
  },
) {
  const attribution = await dbOrTrx
    .selectFrom('attribution')
    .select(['is_external'])
    .where('uuid', '=', attributionUuid)
    .executeTakeFirst();

  if (!attribution) {
    throw new Error(`Attribution ${attributionUuid} does not exist.`);
  }

  if (
    options?.preconditions?.isExternal !== undefined &&
    attribution.is_external !== Number(options.preconditions.isExternal)
  ) {
    throw new Error(
      `Attribution ${attributionUuid} is not ${options.preconditions.isExternal ? 'external' : 'manual'}.`,
    );
  }

  if (options?.preconditions?.minimumResources) {
    const resourceCount = await dbOrTrx
      .selectFrom('resource_to_attribution')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('attribution_uuid', '=', attributionUuid)
      .executeTakeFirstOrThrow();

    if (resourceCount.count < options.preconditions.minimumResources) {
      throw new Error(
        `Attribution ${attributionUuid} has less than ${options.preconditions.minimumResources} resources linked`,
      );
    }
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

export async function getClosestAncestorWithManualAttributionsBelowBreakpoint(
  dbOrTrx: Kysely<DB>,
  resourceId: number,
  options?: { ignoreOwnAttributions: boolean },
) {
  const ancestorWithAttributions =
    await getClosestAncestorWithManualAttributions(
      dbOrTrx,
      resourceId,
      options,
    );

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
  options?: { ignoreOwnAttributions: boolean },
): Promise<number | undefined> {
  const result = await dbOrTrx
    .selectFrom('resource')
    .select((eb) => eb.fn.max<number>('id').as('ancestor_id'))
    .where((eb) =>
      options?.ignoreOwnAttributions
        ? isAncestorOf(eb, resourceId)
        : isAncestorOrSameAs(eb, resourceId),
    )
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
    .where((eb) => isAncestorOrSameAs(eb, resourceId))
    .where('is_attribution_breakpoint', '=', 1)
    .executeTakeFirst();
  return result?.ancestor_id;
}

export async function resourcesToExpand(
  dbOrTrx: Kysely<DB>,
  props: {
    aboveAttributionUuids?: Array<string>;
    aboveResourceId?: number;
    limit?: number;
  },
) {
  // Recursively descend the resource tree, expanding all nodes that fit the filters
  const result = await dbOrTrx
    .withRecursive('expanded_resources', (eb) =>
      eb
        // Start at the root node
        .selectFrom('resource')
        .select('id')
        .where('path', '=', '')
        .unionAll((eb) => {
          // Expand all children of already expanded resources if they fit the criteria
          let query = eb
            .selectFrom('resource as child')
            .innerJoin(
              'expanded_resources as parent',
              'child.parent_id',
              'parent.id',
            )
            .select('child.id')
            .where('child.can_have_children', '=', 1);

          if (props.aboveResourceId !== undefined) {
            query = query.where((eb) =>
              eb.between(
                eb.val(props.aboveResourceId),
                eb.ref('child.id'),
                eb.ref('child.max_descendant_id'),
              ),
            );
          }

          if (props.aboveAttributionUuids) {
            query = query.where((eb) =>
              eb.exists(
                eb
                  .selectFrom('resource_to_attribution as rta')
                  .selectAll()
                  .where((eb) =>
                    eb.between(
                      'rta.resource_id',
                      eb.ref('child.id'),
                      eb.ref('child.max_descendant_id'),
                    ),
                  )
                  .where('attribution_uuid', 'in', props.aboveAttributionUuids),
              ),
            );
          }

          if (props.limit) {
            query = query.limit(props.limit);
          }

          return query;
        }),
    )
    .selectFrom('resource')
    .select(sql<string>`path || '/'`.as('path'))
    .where('id', 'in', (eb) => eb.selectFrom('expanded_resources').select('id'))
    .execute();

  return result.map((r) => r.path);
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

function isAncestorOrSameAs(
  eb: ExpressionBuilder<DB, 'resource'>,
  resourceId: number,
) {
  return eb.and([
    eb('id', '<=', resourceId),
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

export function attributionToResourceRelationship({
  resource,
  ancestorId,
}: {
  resource: { id: number; max_descendant_id: number } | undefined;
  ancestorId: number | undefined;
}) {
  const eb = expressionBuilder<DB, 'attribution'>();

  if (resource === undefined) {
    return eb.val('unrelated');
  }

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
          .where('resource_id', '=', resource.id),
      ),
    )
    .then('same');

  if (ancestorId) {
    expression = expression
      .when(
        eb.exists(
          eb
            .selectFrom('resource_to_attribution')
            .selectAll()
            .whereRef('attribution_uuid', '=', 'attribution.uuid')
            .where('resource_id', '=', ancestorId),
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
          .where((eb) => isDescendantResourceToAttribution(eb, resource)),
      ),
    )
    .then('descendant');

  return expression.else('unrelated').end();
}

export function toCanonicalLicenseName(
  s: Expression<string | null> | string | null,
): RawBuilder<string | null> {
  return sql<string | null>`lower(replace(replace(${s}, '-', ''), ' ', ''))`;
}

export function mergeFilterProperties(
  counts: Array<FilterPropertiesWithCanonicalLicenseNames | undefined>,
): FilterPropertiesWithCanonicalLicenseNames {
  const result = {
    ...Object.fromEntries(['total', ...FILTERS].map((f) => [f, 0])),
    licenses: [] as Array<{ name: string; canonical_name: string }>,
  } as FilterPropertiesWithCanonicalLicenseNames;

  for (const sum of counts.filter((s) => s !== undefined)) {
    for (const [k, v] of Object.entries(sum)) {
      if (k === 'licenses') {
        result.licenses = [
          ...new Set([
            ...result.licenses,
            ...(v as Array<{ name: string; canonical_name: string }>),
          ]),
        ];
      } else {
        result[k as keyof Omit<FilterProperties, 'licenses'>] += v as number;
      }
    }
  }

  return result;
}

const DEFAULT_BATCH_SIZE = 30000;

export async function withBatching<P, R>(
  input: Array<P> | undefined,
  f: (arg: Array<P> | undefined) => Promise<R>,
  props?: { batchSize: number },
): Promise<Array<R>> {
  const batchSize = props?.batchSize ?? DEFAULT_BATCH_SIZE;

  if (input === undefined) {
    return [await f(input)];
  }

  const results: Array<R> = [];

  const numBatches = Math.ceil(input.length / batchSize);
  for (let i = 0; i < numBatches; i += 1) {
    const batch = input.slice(i * batchSize, (i + 1) * batchSize);

    const result = await f(batch);
    results.push(result);
  }

  return results;
}

type CamelToSnakeCase<S extends string> = S extends `${infer T}${infer U}`
  ? `${T extends Capitalize<T> ? '_' : ''}${Lowercase<T>}${CamelToSnakeCase<U>}`
  : S;
export function toSnakeCase<S extends string>(s: S): CamelToSnakeCase<S> {
  return snakeCase(s) as CamelToSnakeCase<S>;
}

export async function computeWasPreferred(
  trx: Transaction<DB>,
  packageInfo: PackageInfo,
): Promise<boolean | undefined> {
  const originalAttributionId = packageInfo.originalAttributionId;
  if (!originalAttributionId) {
    return packageInfo.wasPreferred;
  }

  const original = await trx
    .selectFrom('attribution')
    .select('data')
    .where('uuid', '=', originalAttributionId)
    .executeTakeFirstOrThrow();

  const originalData = JSON.parse(original.data) as PackageInfo;
  return (
    (areAttributionsEqual(packageInfo, originalData) &&
      originalData.wasPreferred) ||
    undefined
  );
}

export function removeParentFromPath(parentPath: string, path: string) {
  return path.replace(new RegExp(`^${escapeRegExp(parentPath)}/?`), '');
}

export function linkAttribution(
  trx: Transaction<DB>,
  resourceId: number,
  attributionUuid: string,
  options?: { ignoreExisting?: boolean },
) {
  return trx
    .insertInto('resource_to_attribution')
    .values({
      resource_id: resourceId,
      attribution_uuid: attributionUuid,
      attribution_is_external: 0,
    })
    .$if(options?.ignoreExisting ?? false, (eb) =>
      eb.onConflict((oc) => oc.doNothing()),
    )
    .execute();
}

export async function findMatchingAttributionUuid(
  trx: Transaction<DB>,
  packageInfo: PackageInfo,
  options?: { ignorePreSelected?: boolean },
) {
  const strippedPackageInfo = removeEmptyStrings(packageInfo);

  let query = await trx
    .selectFrom('attribution')
    .select('uuid')
    .where('is_external', '=', 0)
    .$if(!options?.ignorePreSelected, (eb) => eb.where('pre_selected', '=', 0));

  const attributesToCompare = [
    ...FORM_ATTRIBUTES,
    ...(!strippedPackageInfo.firstParty ? thirdPartyKeys : []),
  ];

  for (const attribute of attributesToCompare) {
    query = query.where(
      strippedPackageInfo[attribute] === undefined
        ? sql<boolean>`data->${attribute} IS NULL`
        : sql<boolean>`data->${attribute} = ${JSON.stringify(strippedPackageInfo[attribute])}`,
    );
  }

  const matchedAttribution = await query.executeTakeFirst();

  return matchedAttribution?.uuid;
}

export async function matchOrCreateAttribution(
  trx: Transaction<DB>,
  packageInfo: PackageInfo,
  options?: { ignorePreSelected?: boolean },
) {
  const matchedAttributionUuid = await findMatchingAttributionUuid(
    trx,
    packageInfo,
    options,
  );

  if (matchedAttributionUuid) {
    return matchedAttributionUuid;
  }

  const newUuid = uuid4();
  await trx
    .insertInto('attribution')
    .values({
      uuid: newUuid,
      data: JSON.stringify({ ...removeEmptyStrings(packageInfo), id: newUuid }),
      is_external: 0,
    })
    .execute();
  return newUuid;
}

export async function updateAttribution(
  trx: Transaction<DB>,
  attributionUuid: string,
  packageInfo: PackageInfo,
) {
  const existingAttribution = await getAttributionOrThrow(trx, attributionUuid);

  if (existingAttribution.is_external) {
    throw new Error("External attributions can't be updated");
  }

  const wasPreferred = await computeWasPreferred(trx, packageInfo);

  console.log('Updating attribution', attributionUuid);
  await trx
    .updateTable('attribution')
    .set({
      data: JSON.stringify({
        ...removeEmptyStrings(packageInfo),
        wasPreferred,
      }),
    })
    .where('uuid', '=', attributionUuid)
    .execute();
}

export async function replaceAttribution(
  trx: Transaction<DB>,
  params: {
    attributionIdToReplace: string;
    attributionIdToReplaceWith: string;
  },
) {
  const toReplace = await getAttributionOrThrow(
    trx,
    params.attributionIdToReplace,
  );

  if (toReplace.is_external) {
    throw new Error(
      `External attribution ${params.attributionIdToReplace} can't be replaced`,
    );
  }

  const toReplaceWith = await getAttributionOrThrow(
    trx,
    params.attributionIdToReplaceWith,
  );

  if (toReplaceWith.is_external) {
    throw new Error(
      `External attribution ${params.attributionIdToReplace} can't replace manual attribution`,
    );
  }

  const connectedResources = await trx
    .selectFrom('resource_to_attribution')
    .select('resource_id')
    .where('attribution_uuid', '=', params.attributionIdToReplace)
    .execute();

  // Reassign resource links to the replacement attribution, skipping conflicts
  // (conflicting links will be cascade deleted when the old attribution is removed)
  await sql`
  UPDATE OR IGNORE resource_to_attribution
  SET attribution_uuid = ${params.attributionIdToReplaceWith}
  WHERE attribution_uuid = ${params.attributionIdToReplace}
`.execute(trx);

  await trx
    .deleteFrom('attribution')
    .where('uuid', '=', params.attributionIdToReplace)
    .execute();

  await removeRedundantAttributions(trx, {
    resourceIds: connectedResources.map((r) => r.resource_id),
  });
}

export function removeEmptyStrings(packageInfo: PackageInfo): PackageInfo {
  return pickBy(
    packageInfo,
    (value, key) => value !== '' || key === 'id',
  ) as PackageInfo;
}
