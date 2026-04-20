// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

import { type Attributions, type PackageInfo } from '../../shared/shared-types';
import { getDb } from '../db/db';
import {
  addManualOrExternalCaaToResources,
  removeManualOrExternalCaaFromResources,
} from './progressBarUtils';
import { type QueryName, type QueryParams } from './queries';
import {
  computeWasPreferred,
  getAttributionOrThrow,
  getResourceOrThrow,
  matchOrCreateAttribution,
  removeRedundantAttributions,
} from './utils';

type QueryInvalidation<Q extends QueryName> = {
  queryName: Q;
  params?: QueryParams<Q>;
};

// Immediately Indexed Mapped Type: Ensures that queryName and params match
type QueryInvalidationUnion = {
  [Q in QueryName]: QueryInvalidation<Q>;
}[QueryName];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MutationFunction = (params?: any) => Promise<{
  result?: unknown;
  invalidates?: Array<QueryInvalidationUnion>;
}>;

const PROGRESS_BAR_INVALIDATIONS: Array<QueryInvalidationUnion> = [
  { queryName: 'getAttributionProgressBarData' },
  { queryName: 'getNextFileToReviewForAttribution' },
  { queryName: 'getCriticalityProgressBarData' },
  { queryName: 'getNextFileToReviewForCriticality' },
  { queryName: 'getClassificationProgressBarData' },
  { queryName: 'getNextFileToReviewForClassification' },
];

const ATTRIBUTION_AGGREGATE_INVALIDATIONS: Array<QueryInvalidationUnion> = [
  ...PROGRESS_BAR_INVALIDATIONS,
  { queryName: 'listAttributions' },
  { queryName: 'filterProperties' },
  { queryName: 'licenseTable' },
  { queryName: 'autoCompleteOptions' },
];

const MANUAL_ATTRIBUTION_INVALIDATIONS: Array<QueryInvalidationUnion> = [
  { queryName: 'manualAttributionStatistics' },
  { queryName: 'getManualAttributionOnResourceOrAncestor' },
  { queryName: 'resourceHasIncompleteManualAttributions' },
];

const EXTERNAL_ATTRIBUTION_INVALIDATIONS: Array<QueryInvalidationUnion> = [
  { queryName: 'externalAttributionStatistics' },
  { queryName: 'resolvedAttributionUuids' },
];

const RESOURCE_TREE_INVALIDATIONS: Array<QueryInvalidationUnion> = [
  { queryName: 'getResourceTree' },
  { queryName: 'getResourcePathsAndParentsForAttributions' },
];

export const mutations = {
  invalidateGetAttributionData() {
    // to avoid typescript errors in backendClient, we need at least one mutation with no parameters, and an invalidation without parameters
    return Promise.resolve({
      invalidates: [{ queryName: 'getAttributionData' }],
    });
  },
  async deleteAttributions(params: { attributionUuids: Array<string> }) {
    await getDb()
      .transaction()
      .execute(async (trx) => {
        await removeManualOrExternalCaaFromResources(trx, 'manual', {
          attributionUuids: params.attributionUuids,
        });
        const impactedResources = new Set<number>();
        for (const attributionUuid of params.attributionUuids) {
          const existingAttribution = await getAttributionOrThrow(
            trx,
            attributionUuid,
          );

          if (existingAttribution.is_external) {
            throw new Error(
              "External attributions can't be deleted, they can only be resolved",
            );
          }

          const connectedResources = await trx
            .selectFrom('resource_to_attribution')
            .select('resource_id')
            .where('attribution_uuid', '=', attributionUuid)
            .execute();

          connectedResources.forEach((r) =>
            impactedResources.add(r.resource_id),
          );

          await trx
            .deleteFrom('attribution')
            .where('uuid', '=', attributionUuid)
            .execute();
        }

        await removeRedundantAttributions(trx, {
          resourceIds: Array.from(impactedResources),
        });
      });

    return {
      invalidates: [
        ...params.attributionUuids.map((attributionUuid) => ({
          queryName: 'getAttributionData' as const,
          params: { attributionUuid },
        })),
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
      ],
    };
  },

  async replaceAttribution(params: {
    attributionIdToReplace: string;
    attributionIdToReplaceWith: string;
  }) {
    await getDb()
      .transaction()
      .execute(async (trx) => {
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
      });

    return {
      invalidates: [
        {
          queryName: 'getAttributionData',
          params: { attributionUuid: params.attributionIdToReplace },
        },
        {
          queryName: 'getAttributionData',
          params: { attributionUuid: params.attributionIdToReplaceWith },
        },
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        { queryName: 'getResourceCountOnAttribution' },
      ],
    };
  },

  async linkAttribution(params: {
    resourcePath: string;
    attributionUuid: string;
  }) {
    await getDb()
      .transaction()
      .execute(async (trx) => {
        const resource = await getResourceOrThrow(trx, params.resourcePath);

        const attribution = await getAttributionOrThrow(
          trx,
          params.attributionUuid,
        );

        if (attribution.is_external) {
          throw new Error(
            'Only manual attributions can be linked to resources',
          );
        }

        await trx
          .insertInto('resource_to_attribution')
          .values({
            resource_id: resource.id,
            attribution_uuid: params.attributionUuid,
            attribution_is_external: attribution.is_external,
          })
          .onConflict((oc) => oc.doNothing())
          .execute();

        await addManualOrExternalCaaToResources(trx, 'manual', {
          attributionUuids: [params.attributionUuid],
          resourceIds: [resource.id],
        });

        await removeRedundantAttributions(trx, {
          attributionUuids: [params.attributionUuid],
          resourceIds: [resource.id],
        });
      });

    return {
      invalidates: [
        {
          queryName: 'getAttributionData',
          params: { attributionUuid: params.attributionUuid },
        },
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        { queryName: 'getResourceCountOnAttribution' },
      ],
    };
  },

  async createAttribution(params: {
    attributionUuid: string;
    packageInfo: PackageInfo;
    resourcePath: string;
  }) {
    await getDb()
      .transaction()
      .execute(async (trx) => {
        const resource = await getResourceOrThrow(trx, params.resourcePath);

        const existingAttribution = await trx
          .selectFrom('attribution')
          .select(['uuid', 'is_external'])
          .where('uuid', '=', params.attributionUuid)
          .executeTakeFirst();

        if (existingAttribution) {
          throw new Error(
            `Attribution ${params.attributionUuid} already exists.`,
          );
        }

        const wasPreferred = await computeWasPreferred(trx, params.packageInfo);

        await trx
          .insertInto('attribution')
          .values({
            uuid: params.attributionUuid,
            data: JSON.stringify({ ...params.packageInfo, wasPreferred }),
            is_external: 0,
          })
          .execute();

        await trx
          .insertInto('resource_to_attribution')
          .values({
            resource_id: resource.id,
            attribution_uuid: params.attributionUuid,
            attribution_is_external: 0,
          })
          .execute();

        await addManualOrExternalCaaToResources(trx, 'manual', {
          attributionUuids: [params.attributionUuid],
          resourceIds: [resource.id],
        });
      });

    return {
      invalidates: [
        {
          queryName: 'getAttributionData',
          params: { attributionUuid: params.attributionUuid },
        },
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
      ],
    };
  },

  async updateAttributions(params: { attributions: Attributions }) {
    await getDb()
      .transaction()
      .execute(async (trx) => {
        for (const [attributionUuid, attributionData] of Object.entries(
          params.attributions,
        )) {
          const existingAttribution = await getAttributionOrThrow(
            trx,
            attributionUuid,
          );

          if (existingAttribution.is_external) {
            throw new Error("External attributions can't be updated");
          }

          const wasPreferred = await computeWasPreferred(trx, attributionData);

          await trx
            .updateTable('attribution')
            .set({
              data: JSON.stringify({ ...attributionData, wasPreferred }),
            })
            .where('uuid', '=', attributionUuid)
            .execute();
        }
      });

    return {
      invalidates: [
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        ...Object.keys(params.attributions).map((attributionUuid) => ({
          queryName: 'getAttributionData' as const,
          params: { attributionUuid },
        })),
      ],
    };
  },

  async resolveAttributions(params: { attributionUuids: Array<string> }) {
    return setAttributionsResolvedStatus(params.attributionUuids, true);
  },
  async unresolveAttributions(params: { attributionUuids: Array<string> }) {
    return setAttributionsResolvedStatus(params.attributionUuids, false);
  },

  async unlinkResourceFromAttributions(params: {
    resourcePath: string;
    attributionUuids: Array<string>;
  }) {
    await getDb()
      .transaction()
      .execute(async (trx) => {
        const resource = await getResourceOrThrow(trx, params.resourcePath);
        await removeManualOrExternalCaaFromResources(trx, 'manual', {
          attributionUuids: params.attributionUuids,
          resourceIds: [resource.id],
        });

        for (const attributionUuid of params.attributionUuids) {
          const existingAttribution = await getAttributionOrThrow(
            trx,
            attributionUuid,
          );

          if (existingAttribution.is_external) {
            throw new Error(
              'Only manual attributions can be unlinked from resources',
            );
          }

          await trx
            .deleteFrom('resource_to_attribution')
            .where('resource_id', '=', resource.id)
            .where('attribution_uuid', '=', attributionUuid)
            .execute();
        }

        await removeRedundantAttributions(trx, { resourceIds: [resource.id] });
      });

    return {
      invalidates: [
        ...params.attributionUuids.map((attributionUuid) => ({
          queryName: 'getAttributionData' as const,
          params: { attributionUuid },
        })),
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        { queryName: 'getResourceCountOnAttribution' } as const,
      ],
    };
  },
  async updateRootBaseURL(params: { baseURL: string }) {
    await getDb()
      .updateTable('resource')
      .set('base_url', params.baseURL)
      .where('path', '=', '')
      .execute();

    return {
      invalidates: [{ queryName: 'getBaseUrlForSource' as const }],
    };
  },

  async modifyOnlyOnOneResource(params: {
    resourceId: string;
    packageInfo: PackageInfo;
  }) {
    await getDb()
      .transaction()
      .execute(async (trx) => {
        const resource = await getResourceOrThrow(trx, params.resourceId);
        await getAttributionOrThrow(trx, params.packageInfo.id, {
          preconditions: { isExternal: false, minimumResources: 2 },
        });

        await removeManualOrExternalCwaFromResources(trx, 'manual', {
          attributionUuids: [params.packageInfo.id],
          resourceIds: [resource.id],
        });

        await trx
          .deleteFrom('resource_to_attribution')
          .where('resource_id', '=', resource.id)
          .where('attribution_uuid', '=', params.packageInfo.id)
          .execute();

        const attributionToLink = await matchOrCreateAttribution(
          trx,
          params.packageInfo,
          false,
        );

        await trx
          .insertInto('resource_to_attribution')
          .values({
            resource_id: resource.id,
            attribution_uuid: attributionToLink,
            attribution_is_external: 0,
          })
          .execute();

        await addManualOrExternalCwaToResources(trx, 'manual', {
          attributionUuids: [attributionToLink],
          resourceIds: [resource.id],
        });

        await removeRedundantAttributions(trx, { resourceIds: [resource.id] });
      });
    return {
      invalidates: [
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
      ],
    };
  },
} satisfies Record<string, MutationFunction>;

async function setAttributionsResolvedStatus(
  attributionUuids: Array<string>,
  resolvedStatus: boolean,
) {
  await getDb()
    .transaction()
    .execute(async (trx) => {
      if (resolvedStatus) {
        await removeManualOrExternalCaaFromResources(trx, 'external', {
          attributionUuids,
        });
      } else {
        await addManualOrExternalCaaToResources(trx, 'external', {
          attributionUuids,
        });
      }

      const existingAttributions = await trx
        .selectFrom('attribution')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .where('uuid', 'in', attributionUuids)
        .where('is_external', '=', 1)
        .executeTakeFirstOrThrow();

      if (existingAttributions.count !== attributionUuids.length) {
        throw new Error(
          `Expected to set ${attributionUuids.length} to ${resolvedStatus ? 'resolved' : 'unresolved'}, but only ${existingAttributions.count} were found`,
        );
      }

      await trx
        .updateTable('attribution')
        .set({ is_resolved: Number(resolvedStatus) })
        .where('uuid', 'in', attributionUuids)
        .execute();
    });

  return {
    invalidates: [
      ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
      ...EXTERNAL_ATTRIBUTION_INVALIDATIONS,
      ...attributionUuids.map((attributionUuid) => ({
        queryName: 'getAttributionData' as const,
        params: { attributionUuid },
      })),
      { queryName: 'getResourceTree' } as const,
    ],
  };
}

export type Mutations = typeof mutations;
export type MutationName = keyof Mutations;

export type MutationParams<C extends MutationName> =
  Parameters<Mutations[C]> extends [infer P] ? P : void;
export type MutationReturn<C extends MutationName> = ReturnType<Mutations[C]>;
export type MutationResult<C extends MutationName> =
  Awaited<MutationReturn<C>> extends { result: unknown }
    ? Awaited<MutationReturn<C>>['result']
    : void;
