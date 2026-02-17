// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

import { Attributions, PackageInfo } from '../../shared/shared-types';
import { getDb } from '../db/db';
import { QueryName, QueryParams } from './queries';
import {
  getAttributionOrThrow,
  getResourceOrThrow,
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

        for (const resource of impactedResources) {
          await removeRedundantAttributions(trx, resource);
        }
      });

    return {
      invalidates: [
        ...params.attributionUuids.map((attributionUuid) => ({
          queryName: 'getAttributionData' as const,
          params: { attributionUuid },
        })),
        { queryName: 'filterCounts' },
        { queryName: 'getResourceTree' },
        { queryName: 'getProgressBarData' },
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

        for (const r of connectedResources) {
          await removeRedundantAttributions(trx, r.resource_id);
        }
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
        { queryName: 'filterCounts' },
        { queryName: 'getResourceTree' },
        { queryName: 'getProgressBarData' },
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

        await removeRedundantAttributions(trx, resource.id);
      });

    return {
      invalidates: [
        {
          queryName: 'getAttributionData',
          params: { attributionUuid: params.attributionUuid },
        },
        { queryName: 'filterCounts' },
        { queryName: 'getResourceTree' },
        { queryName: 'getProgressBarData' },
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

        await trx
          .insertInto('attribution')
          .values({
            uuid: params.attributionUuid,
            data: JSON.stringify(params.packageInfo),
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
      });

    return {
      invalidates: [
        {
          queryName: 'getAttributionData',
          params: { attributionUuid: params.attributionUuid },
        },
        { queryName: 'filterCounts' },
        { queryName: 'getResourceTree' },
        { queryName: 'getProgressBarData' },
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

          await trx
            .updateTable('attribution')
            .set({
              data: JSON.stringify(attributionData),
            })
            .where('uuid', '=', attributionUuid)
            .execute();
        }
      });

    return {
      invalidates: [
        ...Object.keys(params.attributions).map((attributionUuid) => ({
          queryName: 'getAttributionData' as const,
          params: { attributionUuid },
        })),
        { queryName: 'filterCounts' },
        { queryName: 'getProgressBarData' },
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

        await removeRedundantAttributions(trx, resource.id);
      });

    return {
      invalidates: [
        ...params.attributionUuids.map((attributionUuid) => ({
          queryName: 'getAttributionData' as const,
          params: { attributionUuid },
        })),
        { queryName: 'filterCounts' },
        { queryName: 'getResourceTree' },
        { queryName: 'getProgressBarData' },
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
      for (const attributionUuid of attributionUuids) {
        const existingAttribution = await getAttributionOrThrow(
          trx,
          attributionUuid,
        );

        if (!existingAttribution.is_external) {
          throw new Error(
            `Only external attributions can be ${resolvedStatus ? 'resolved' : 'unresolved'}`,
          );
        }

        await trx
          .updateTable('attribution')
          .set({ is_resolved: Number(resolvedStatus) })
          .where('uuid', '=', attributionUuid)
          .execute();
      }
    });

  return {
    invalidates: [
      ...attributionUuids.map((attributionUuid) => ({
        queryName: 'getAttributionData' as const,
        params: { attributionUuid },
      })),
      { queryName: 'filterCounts' as const },
      { queryName: 'getResourceTree' as const },
      { queryName: 'getProgressBarData' as const },
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
