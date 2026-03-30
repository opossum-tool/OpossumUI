// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';
import { omit, uniqBy } from 'lodash';

import {
  type Filter,
  type FilterCounts,
  FILTERS,
} from '../../Frontend/shared-constants';
import { type PackageInfo } from '../../shared/shared-types';
import { text } from '../../shared/text';
import { getDb } from '../db/db';
import { getFilterExpression, getSearchExpression } from './filters';
import { listAttributions } from './listAttributions';
import {
  getAttributionProgressBarData,
  getClassificationProgressBarData,
  getCriticalityProgressBarData,
  getNextFileToReviewForAttribution,
  getNextFileToReviewForClassification,
  getNextFileToReviewForCriticality,
} from './progressBarQueries';
import { getResourceTree } from './resourceTree';
import {
  externalAttributionStatistics,
  licenseTable,
  manualAttributionStatistics,
} from './statistics';
import {
  attributionToResourceRelationship,
  GET_LEGACY_RESOURCE_PATH,
  getClosestAncestorWithManualAttributionsBelowBreakpoint,
  getResourceOrThrow,
  mergeFilterProperties,
  removeTrailingSlash,
  type ResourceRelationship,
  resourcesToExpand,
  toCanonicalLicenseName,
  toSnakeCase,
} from './utils';

type AutocompletableAttribute =
  | 'packageType'
  | 'packageNamespace'
  | 'packageName'
  | 'packageVersion'
  | 'url'
  | 'licenseName';

type AutocompleteOptions = Record<
  'manual' | 'external',
  Array<{ contained_uuid: string; value: string; count: number }>
>;

export type FilterProperties = FilterCounts & {
  total: number;
  licenses: Array<string>;
};

export type FilterPropertiesWithCanonicalLicenseNames = Omit<
  FilterProperties,
  'licenses'
> & { licenses: Array<{ name: string; canonical_name: string }> };

type AttributionCounts = Partial<
  Record<ResourceRelationship, FilterProperties>
> &
  Record<'all' | 'sameOrDescendant', FilterProperties>;

type QueryFunction = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  param?: any,
) => Promise<{ result: NonNullable<unknown> | null }>; // Tanstack doesn't allow functions to return undefined

export const queries = {
  listAttributions,
  getResourceTree,
  manualAttributionStatistics,
  externalAttributionStatistics,
  licenseTable,

  async getAttributionData(props: { attributionUuid: string }) {
    const result = await getDb()
      .selectFrom('attribution')
      .select(['data', 'is_external'])
      .where('uuid', '=', props.attributionUuid)
      .executeTakeFirstOrThrow();

    return {
      result: {
        packageInfo: JSON.parse(result.data) as PackageInfo,
        isExternal: Boolean(result.is_external),
      },
    };
  },

  async getManualAttributionOnResourceOrAncestor(props: {
    resourcePath: string;
  }) {
    const resource = await getResourceOrThrow(getDb(), props.resourcePath);

    const manualAttributionOnResource = await getDb()
      .selectFrom('attribution')
      .innerJoin(
        'resource_to_attribution',
        'attribution.uuid',
        'resource_to_attribution.attribution_uuid',
      )
      .select('data')
      .where('resource_id', '=', resource.id)
      .where('attribution_is_external', '=', 0)
      .limit(1)
      .executeTakeFirst();

    if (manualAttributionOnResource) {
      return {
        result: JSON.parse(manualAttributionOnResource.data) as PackageInfo,
      };
    }

    const ancestor =
      await getClosestAncestorWithManualAttributionsBelowBreakpoint(
        getDb(),
        resource.id,
      );

    if (ancestor) {
      const manualAttributionOnAncestor = await getDb()
        .selectFrom('attribution')
        .innerJoin(
          'resource_to_attribution',
          'attribution.uuid',
          'resource_to_attribution.attribution_uuid',
        )
        .select('data')
        .where('resource_id', '=', ancestor)
        .where('attribution_is_external', '=', 0)
        .limit(1)
        .executeTakeFirstOrThrow();

      return {
        result: JSON.parse(manualAttributionOnAncestor.data) as PackageInfo,
      };
    }

    return { result: null };
  },

  async autoCompleteOptions({
    attributeName,
    onlyRelatedToResourcePath,
  }: {
    attributeName: AutocompletableAttribute;
    onlyRelatedToResourcePath: string;
  }): Promise<{
    result: AutocompleteOptions;
  }> {
    const onlyRelatedToResource = await getResourceOrThrow(
      getDb(),
      onlyRelatedToResourcePath,
    );

    const closestAncestorToResource =
      await getClosestAncestorWithManualAttributionsBelowBreakpoint(
        getDb(),
        onlyRelatedToResource.id,
      );

    let query = getDb()
      .selectFrom('attribution')
      .select((eb) => [
        'uuid as contained_uuid',
        eb.ref(toSnakeCase(attributeName)).$notNull().as('value'),
        'is_external',
        eb.fn.countAll<number>().as('count'),
      ])
      .where('is_resolved', '=', 0)
      .where(toSnakeCase(attributeName), 'is not', null)
      .where(toSnakeCase(attributeName), '!=', '')
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('resource_to_attribution')
            .selectAll()
            .whereRef('attribution_uuid', '=', 'attribution.uuid')
            .where((eb) =>
              eb.or([
                eb.between(
                  'resource_id',
                  onlyRelatedToResource.id,
                  onlyRelatedToResource.max_descendant_id,
                ),
                ...(closestAncestorToResource
                  ? [eb('resource_id', '=', closestAncestorToResource)]
                  : []),
              ]),
            ),
        ),
      );

    query = query.groupBy(['value', 'is_external']);

    const result = await query.execute();

    return {
      result: {
        external: result.filter((r) => r.is_external === 1),
        manual: result.filter((r) => r.is_external === 0),
      },
    };
  },

  async filterProperties(props: {
    external: boolean;
    filters: Array<Filter>;
    resourcePathForRelationships: string;
    license?: string;
    search?: string;
    showResolved?: boolean;
  }): Promise<{
    result: AttributionCounts;
  }> {
    const db = getDb();
    const resource = await getResourceOrThrow(
      db,
      props.resourcePathForRelationships,
    );

    const closestAncestor =
      await getClosestAncestorWithManualAttributionsBelowBreakpoint(
        db,
        resource.id,
      );

    let query = db
      .selectFrom('attribution')
      .select(
        attributionToResourceRelationship({
          resource,
          ancestorId: closestAncestor,
        }).as('relationship'),
      )
      .select((eb) => eb.fn.countAll<number>().as('total'))
      .select((eb) =>
        FILTERS.map((f) =>
          eb.fn
            .sum<number>(
              eb.case().when(getFilterExpression(f)).then(1).else(0).end(),
            )
            .as(f),
        ),
      )
      .select(
        sql<string>`
          json_group_array(distinct json_object(
            'name', trim(license_name),
            'canonical_name', canonical_license_name
          ))`.as('licenses'),
      )
      .groupBy('relationship');

    query = query.where('is_external', '=', Number(props.external));

    for (const filter of props.filters) {
      query = query.where(getFilterExpression(filter));
    }

    if (props.license) {
      query = query.where(
        'canonical_license_name',
        '=',
        toCanonicalLicenseName(props.license),
      );
    }

    if (props.search) {
      const search = props.search;
      query = query.where(getSearchExpression(search));
    }

    if (!props.showResolved) {
      query = query.where('is_resolved', '=', 0);
    }

    const sums = await query.execute();

    const sumsPerRelationship = Object.fromEntries(
      sums.map((s) => [
        s.relationship,
        {
          ...omit(s, 'relationship', 'licenses'),
          licenses: JSON.parse(s.licenses) ?? [],
        },
      ]),
    ) as Record<
      ResourceRelationship,
      FilterPropertiesWithCanonicalLicenseNames
    >;
    const all = mergeFilterProperties(Object.values(sumsPerRelationship));
    const sameOrDescendant = mergeFilterProperties([
      sumsPerRelationship.same,
      sumsPerRelationship.descendant,
    ]);

    const byRelationship = { ...sumsPerRelationship, all, sameOrDescendant };

    const deduplicatedByRelationship: AttributionCounts =
      {} as AttributionCounts;

    for (const relationship of Object.keys(byRelationship) as Array<
      keyof typeof byRelationship
    >) {
      const count = byRelationship[relationship];
      if (count === undefined) {
        continue;
      }
      const deduplicatedLicenses = uniqBy(
        count.licenses,
        (l) => l.canonical_name,
      )
        .map((l) => l.name)
        .filter(Boolean)
        .toSorted();
      deduplicatedByRelationship[relationship] = {
        ...count,
        licenses: deduplicatedLicenses,
      };
    }

    return { result: deduplicatedByRelationship };
  },

  async resolvedAttributionUuids() {
    const result = await getDb()
      .selectFrom('attribution')
      .select('uuid')
      .where('is_resolved', '=', 1)
      .execute();

    return { result: new Set(result.map((r) => r.uuid)) };
  },

  async getNodePathsToExpand({ fromNodePath }: { fromNodePath: string }) {
    const nodesToExpand = await getDb()
      .withRecursive('nodes', (eb) =>
        eb
          .selectFrom('resource')
          .select(['id', GET_LEGACY_RESOURCE_PATH])
          .where('path', '=', removeTrailingSlash(fromNodePath))
          .unionAll(
            eb
              .selectFrom('resource')
              .innerJoin('nodes', 'resource.parent_id', 'nodes.id')
              .select(['resource.id', GET_LEGACY_RESOURCE_PATH])
              .where('resource.can_have_children', '=', 1)
              .where(
                sql<number>`(select count(*) from resource where parent_id = nodes.id)`,
                '=',
                1,
              ),
          ),
      )
      .selectFrom('nodes')
      .select('path')
      .execute();

    return { result: nodesToExpand.map((n) => n.path) };
  },

  /**
   * If prioritizeResourcePath is given, it will always be included in the list
   * except if its level is deeper than `limit`.
   */
  async getResourcePathsAndParentsForAttributions({
    attributionUuids,
    limit,
    prioritizedResourcePath,
  }: {
    attributionUuids: Array<string>;
    limit?: number;
    prioritizedResourcePath?: string;
  }) {
    const results: Array<string> = [];

    if (prioritizedResourcePath) {
      const prioritizedResource = await getResourceOrThrow(
        getDb(),
        prioritizedResourcePath,
      );

      results.push(
        ...(await resourcesToExpand(getDb(), {
          aboveAttributionUuids: attributionUuids,
          aboveResourceId: prioritizedResource.id,
          limit,
        })),
      );
    }

    results.push(
      ...(await resourcesToExpand(getDb(), {
        aboveAttributionUuids: attributionUuids,
        limit,
      })),
    );

    const deduplicatedLimitedResults = new Set<string>();

    for (const r of results) {
      deduplicatedLimitedResults.add(r);
      if (limit && deduplicatedLimitedResults.size === limit) {
        break;
      }
    }

    return { result: Array.from(deduplicatedLimitedResults) };
  },

  async getFrequentLicenseNames() {
    const result = await getDb()
      .selectFrom('frequent_license')
      .select(['short_name as shortName', 'full_name as fullName'])
      .execute();

    return { result };
  },

  async getFrequentLicenseText(props: { licenseName: string }) {
    const result = await getDb()
      .selectFrom('frequent_license')
      .select('license_text')
      .where((eb) =>
        eb.or([
          eb('short_name', '=', props.licenseName),
          eb('full_name', '=', props.licenseName),
        ]),
      )
      .executeTakeFirst();

    return { result: result?.license_text ?? null };
  },

  getAttributionProgressBarData,
  getCriticalityProgressBarData,
  getClassificationProgressBarData,
  getNextFileToReviewForAttribution,
  getNextFileToReviewForCriticality,
  getNextFileToReviewForClassification,

  async resourceHasIncompleteManualAttributions({
    resourcePath,
  }: {
    resourcePath: string;
  }) {
    const result = await getDb()
      .transaction()
      .execute(async (trx) => {
        const resource = await getResourceOrThrow(trx, resourcePath);
        const attributions = await trx
          .selectFrom('resource_to_attribution')
          .innerJoin('attribution', 'uuid', 'attribution_uuid')
          .select('attribution.data')
          .where('resource_id', '=', resource.id)
          .where('attribution.is_external', '=', 0)
          .where((eb) =>
            eb.or([
              getFilterExpression(text.filters.incompleteCoordinates),
              getFilterExpression(text.filters.incompleteLegal),
            ]),
          )
          .limit(1)
          .executeTakeFirst();
        return !!attributions;
      });
    return { result };
  },
} satisfies Record<string, QueryFunction>;

export type Queries = typeof queries;
export type QueryName = keyof Queries;

// Queries have either one parameter P (QueryParams = P) or none (QueryParams = void)
export type QueryParams<C extends QueryName> =
  Parameters<Queries[C]> extends [infer P] ? P : void;
export type QueryReturn<C extends QueryName> = ReturnType<Queries[C]>;
export type QueryResult<C extends QueryName> = Awaited<
  QueryReturn<C>
>['result'];
