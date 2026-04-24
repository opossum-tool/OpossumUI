// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { omit } from 'lodash';

import { type Attributions } from '../../shared/shared-types';
import { getDb } from '../db/db';
import {
  addManualOrExternalCaaToResources,
  removeManualOrExternalCaaFromResources,
} from './progressBarUtils';
import { type QueryName, type QueryParams } from './queries';
import {
  ensureAttributionsAreLinkedOnMultipleResources,
  ensureAttributionsAreNotExternal,
  findMatchingAttributionUuid,
  getAttributionOrThrow,
  getResourceOrThrow,
  linkAttributions,
  matchOrCreateAttributions,
  removeRedundantAttributions,
  replaceAttributions,
  unlinkAttributions,
  updateAttribution,
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

  async replaceAttributions(params: {
    attributionUuidsToReplace: Array<string>;
    attributionUuidToReplaceWith: string;
  }) {
    await getDb()
      .transaction()
      .execute(async (trx) => {
        await replaceAttributions(trx, params);
      });

    return {
      invalidates: [
        ...params.attributionUuidsToReplace.map((attributionUuid) => ({
          queryName: 'getAttributionData' as const,
          params: { attributionUuid },
        })),
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        { queryName: 'getResourceCountOnAttribution' },
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
          await updateAttribution(trx, attributionUuid, attributionData);
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

  async modifyOrMatchOnlyOnOneResource(params: {
    resourcePath: string;
    attributions: Attributions;
  }) {
    const result = await getDb()
      .transaction()
      .execute(async (trx) => {
        const resource = await getResourceOrThrow(trx, params.resourcePath);
        const inputUuids = Object.keys(params.attributions);
        await ensureAttributionsAreNotExternal(trx, inputUuids);
        await ensureAttributionsAreLinkedOnMultipleResources(trx, inputUuids);

        await unlinkAttributions(trx, resource.id, inputUuids);

        const oldUuidsToNewUuids = await matchOrCreateAttributions(
          trx,
          params.attributions,
        );

        await linkAttributions(
          trx,
          resource.id,
          Object.values(oldUuidsToNewUuids),
          {
            ignoreExisting: true,
          },
        );

        await removeRedundantAttributions(trx, { resourceIds: [resource.id] });

        return { oldUuidsToNewUuids };
      });
    return {
      invalidates: [
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...Object.keys(params.attributions).map((attributionUuid) => ({
          queryName: 'getAttributionData' as const,
          params: { attributionUuid },
        })),
        { queryName: 'getResourceCountOnAttribution' },
      ],
      result,
    };
  },

  async createOrMatchAttributions(params: {
    resourcePath: string;
    attributions: Attributions;
  }) {
    const result = await getDb()
      .transaction()
      .execute(async (trx) => {
        const resource = await getResourceOrThrow(trx, params.resourcePath);

        const inputKeysToNewUuids = await matchOrCreateAttributions(
          trx,
          params.attributions,
          { ignorePreSelected: true },
        );

        await linkAttributions(
          trx,
          resource.id,
          Object.values(inputKeysToNewUuids),
          { ignoreExisting: true },
        );

        await addManualOrExternalCaaToResources(trx, 'manual', {
          resourceIds: [resource.id],
          attributionUuids: Object.values(inputKeysToNewUuids),
        });

        await removeRedundantAttributions(trx, { resourceIds: [resource.id] });

        return { inputKeysToNewUuids };
      });

    return {
      invalidates: [
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        { queryName: 'getResourceCountOnAttribution' },
      ],
      result,
    };
  },

  async updateOrMatchAttributions(params: { attributions: Attributions }) {
    const result = await getDb()
      .transaction()
      .execute(async (trx) => {
        const oldUuidsToNewUuids: Record<string, string> = {};
        for (const [attributionUuid, attributionData] of Object.entries(
          params.attributions,
        )) {
          // Updating an attribution always removes preselected
          const newPackageInfo = omit(attributionData, 'preSelected');
          const matchingAttributionUuid = await findMatchingAttributionUuid(
            trx,
            newPackageInfo,
          );
          if (matchingAttributionUuid) {
            await replaceAttributions(trx, {
              attributionUuidsToReplace: [attributionUuid],
              attributionUuidToReplaceWith: matchingAttributionUuid,
            });
            oldUuidsToNewUuids[attributionUuid] = matchingAttributionUuid;
          } else {
            await updateAttribution(trx, attributionUuid, newPackageInfo);
            oldUuidsToNewUuids[attributionUuid] = attributionUuid;
          }
        }
        return { oldUuidsToNewUuids };
      });
    return {
      invalidates: [
        ...Object.keys(params.attributions).map((attributionUuid) => ({
          queryName: 'getAttributionData' as const,
          params: { attributionUuid },
        })),
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        { queryName: 'getResourceCountOnAttribution' },
      ],
      result,
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
