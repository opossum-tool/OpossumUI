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
  type SqlBool,
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
import { type Attributions, type PackageInfo } from '../../shared/shared-types';
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
  { resourceIds }: { resourceIds?: Array<number> },
) {
  let additional_selection: Expression<SqlBool> = sql<SqlBool>`TRUE`;
  if (resourceIds?.length === 1) {
    // Simplest case: Only one resource was changed,
    // we only look at resources that have the same attributions as the changed one (or its parent, if it's empty)
    // Otherwise, we just deduplicate everything

    const attributions = await trx
      .selectFrom('resource_to_attribution')
      .select('attribution_uuid')
      .where('resource_id', '=', (eb) =>
        eb
          .selectFrom('closest_attributed_ancestors')
          .select('manual')
          .where('resource_id', '=', resourceIds[0]),
      )
      .execute();

    if (attributions.length === 0) {
      // No attributions to deduplicate
      return;
    }

    const eb = expressionBuilder<DB, 'resource'>();

    additional_selection = eb.and(
      attributions.map((a) =>
        eb(
          'resource.id',
          'in',
          eb
            .selectFrom('resource_to_attribution')
            .select('resource_id')
            .where('attribution_uuid', '=', a.attribution_uuid),
        ),
      ),
    );
  }

  await trx.schema
    .createTable('duplicate_resources')
    .temporary()
    .as(
      trx
        .selectFrom('resource')
        .select('resource.id as resource_id')
        .innerJoin(
          'closest_attributed_ancestors',
          'resource.parent_id',
          'closest_attributed_ancestors.resource_id',
        )
        .where('is_attribution_breakpoint', '=', 0)
        .where(additional_selection)
        .where(
          sql<boolean>`
            (
              select attribution_uuid
              from resource_to_attribution rta
              where 
                rta.resource_id = resource.id
                and attribution_is_external = 0
            )
            = 
            (
              select attribution_uuid
              from resource_to_attribution rta
              where 
                rta.resource_id = closest_attributed_ancestors.manual
                and attribution_is_external = 0
            )`,
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

async function computeWasPreferred(
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

export async function unlinkAttributions(
  trx: Transaction<DB>,
  resourceId: number,
  attributionUuids: Array<string>,
) {
  await trx
    .deleteFrom('resource_to_attribution')
    .where('resource_id', '=', resourceId)
    .where('attribution_uuid', 'in', attributionUuids)
    .execute();
}

export async function linkAttributions(
  trx: Transaction<DB>,
  resourceId: number,
  attributionUuids: Array<string>,
  options?: { ignoreExisting?: boolean },
) {
  await trx
    .insertInto('resource_to_attribution')
    .values(
      attributionUuids.map((attributionUuid) => ({
        resource_id: resourceId,
        attribution_uuid: attributionUuid,
        attribution_is_external: 0,
      })),
    )
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

  let query = trx
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

async function matchOrCreateAttribution(
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

  const wasPreferred = await computeWasPreferred(trx, packageInfo);

  const newUuid = uuid4();
  await trx
    .insertInto('attribution')
    .values({
      uuid: newUuid,
      data: JSON.stringify({
        ...removeEmptyStrings(packageInfo),
        id: newUuid,
        wasPreferred,
      }),
      is_external: 0,
    })
    .execute();
  return newUuid;
}

export async function matchOrCreateAttributions(
  trx: Transaction<DB>,
  attributions: Attributions,
  options?: { ignorePreSelected?: boolean },
): Promise<Record<string, string>> {
  const inputKeysToNewUuids: Record<string, string> = {};
  for (const [attributionKey, packageInfo] of Object.entries(attributions)) {
    inputKeysToNewUuids[attributionKey] = await matchOrCreateAttribution(
      trx,
      {
        ...packageInfo,
        preSelected: undefined,
      },
      options,
    );
  }
  return inputKeysToNewUuids;
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

export async function ensureAttributionsAreNotExternal(
  trx: Transaction<DB>,
  attributionUuids: Array<string>,
) {
  const externalAttributions = (
    await trx
      .selectFrom('attribution')
      .select('uuid')
      .where('uuid', 'in', attributionUuids)
      .where('is_external', '=', 1)
      .execute()
  ).map((a) => a.uuid);

  if (externalAttributions.length > 0) {
    throw new Error(
      `Attributions with uuids ${attributionUuids.join(', ')} are external`,
    );
  }
}

export async function ensureAttributionsAreLinkedOnMultipleResources(
  trx: Transaction<DB>,
  attributionUuids: Array<string>,
) {
  const attributionsLinkedOnSingleResource = (
    await trx
      .selectFrom('resource_to_attribution')
      .select('attribution_uuid')
      .where('attribution_uuid', 'in', attributionUuids)
      .groupBy('attribution_uuid')
      .having((eb) => eb.fn.countAll(), '<=', 1)
      .execute()
  ).map((attribution) => attribution.attribution_uuid);

  if (attributionsLinkedOnSingleResource.length > 0) {
    throw new Error(
      `Cannot modify attributions with uuids: ${attributionsLinkedOnSingleResource.join(', ')}, if they only link to a single resource`,
    );
  }
}

export async function replaceAttributions(
  trx: Transaction<DB>,
  params: {
    attributionUuidsToReplace: Array<string>;
    attributionUuidToReplaceWith: string;
  },
) {
  await ensureAttributionsAreNotExternal(trx, params.attributionUuidsToReplace);

  const toReplaceWith = await getAttributionOrThrow(
    trx,
    params.attributionUuidToReplaceWith,
  );

  if (toReplaceWith.is_external) {
    throw new Error(
      `External attribution ${params.attributionUuidToReplaceWith} can't replace manual attribution`,
    );
  }

  const connectedResources = (
    await trx
      .selectFrom('resource_to_attribution')
      .select('resource_id')
      .distinct()
      .where('attribution_uuid', 'in', params.attributionUuidsToReplace)
      .execute()
  ).map((r) => r.resource_id);

  // Reassign resource links to the replacement attribution, skipping conflicts
  // (conflicting links will be cascade deleted when the old attribution is removed)
  await sql`
  UPDATE OR IGNORE resource_to_attribution
  SET attribution_uuid = ${params.attributionUuidToReplaceWith}
  WHERE attribution_uuid in (${sql.join(params.attributionUuidsToReplace)})
  `.execute(trx);

  await trx
    .deleteFrom('attribution')
    .where('uuid', 'in', params.attributionUuidsToReplace)
    .execute();

  await removeRedundantAttributions(trx, {
    resourceIds: connectedResources,
  });
}

export function removeEmptyStrings(packageInfo: PackageInfo): PackageInfo {
  return pickBy(
    packageInfo,
    (value, key) => value !== '' || key === 'id',
  ) as PackageInfo;
}
