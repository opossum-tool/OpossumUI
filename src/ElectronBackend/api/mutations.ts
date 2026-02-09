// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sql } from 'kysely';

import { Attributions, PackageInfo } from '../../shared/shared-types';
import { getDb } from '../db/db';
import { QueryName, QueryParams } from './queries';

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

function removeTrailingSlash(path: string) {
  return path.replace(/\/$/, '');
}

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
        for (const attributionUuid of params.attributionUuids) {
          const existingAttribution = await trx
            .selectFrom('attribution')
            .select('is_external')
            .where('uuid', '=', attributionUuid)
            .executeTakeFirst();

          if (!existingAttribution) {
            throw new Error(`Attribution ${attributionUuid} does not exist.`);
          }

          if (existingAttribution.is_external) {
            throw new Error(
              "External attributions can't be deleted, they can only be resolved",
            );
          }

          await trx
            .deleteFrom('attribution')
            .where('uuid', '=', attributionUuid)
            .execute();
        }
      });

    return {
      invalidates: params.attributionUuids.map((attributionUuid) => ({
        queryName: 'getAttributionData',
        params: { attributionUuid },
      })),
    };
  },

  async replaceAttribution(params: {
    attributionIdToReplace: string;
    attributionIdToReplaceWith: string;
  }) {
    await getDb()
      .transaction()
      .execute(async (trx) => {
        const toReplace = await trx
          .selectFrom('attribution')
          .select('is_external')
          .where('uuid', '=', params.attributionIdToReplace)
          .executeTakeFirst();

        const toReplaceWith = await trx
          .selectFrom('attribution')
          .select('uuid')
          .where('uuid', '=', params.attributionIdToReplaceWith)
          .executeTakeFirst();

        if (!toReplace) {
          throw new Error(
            `Attribution to replace ${params.attributionIdToReplace} does not exist.`,
          );
        }

        if (!toReplaceWith) {
          throw new Error(
            `Replacement attribution ${params.attributionIdToReplaceWith} does not exist`,
          );
        }

        if (toReplace.is_external) {
          throw new Error("External attributions can't be replaced");
        }

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
        const resourcePath = removeTrailingSlash(params.resourcePath);

        const resource = await trx
          .selectFrom('resource')
          .select('id')
          .where('path', '=', resourcePath)
          .executeTakeFirst();

        if (!resource) {
          throw new Error(`Resource ${resourcePath} does not exist.`);
        }

        const attribution = await trx
          .selectFrom('attribution')
          .select('uuid')
          .where('uuid', '=', params.attributionUuid)
          .executeTakeFirst();

        if (!attribution) {
          throw new Error(
            `Attribution ${params.attributionUuid} does not exist.`,
          );
        }

        await trx
          .insertInto('resource_to_attribution')
          .values({
            resource_id: resource.id,
            attribution_uuid: params.attributionUuid,
          })
          .onConflict((oc) => oc.doNothing())
          .execute();
      });

    return {
      invalidates: [
        {
          queryName: 'getAttributionData',
          params: { attributionUuid: params.attributionUuid },
        },
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
        const resourcePath = removeTrailingSlash(params.resourcePath);

        const resource = await trx
          .selectFrom('resource')
          .select('id')
          .where('path', '=', resourcePath)
          .executeTakeFirst();

        if (!resource) {
          throw new Error(`Resource ${resourcePath} does not exist.`);
        }

        const existingAttribution = await trx
          .selectFrom('attribution')
          .select('uuid')
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
          })
          .execute();
      });

    return {
      invalidates: [
        {
          queryName: 'getAttributionData',
          params: { attributionUuid: params.attributionUuid },
        },
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
          const existingAttribution = await trx
            .selectFrom('attribution')
            .select('is_external')
            .where('uuid', '=', attributionUuid)
            .executeTakeFirst();

          if (!existingAttribution) {
            throw new Error(`Attribution ${attributionUuid} does not exist.`);
          }

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
      invalidates: Object.keys(params.attributions).map((attributionUuid) => ({
        queryName: 'getAttributionData',
        params: { attributionUuid },
      })),
    };
  },

  async resolveAttributions(params: { attributionUuids: Array<string> }) {
    await getDb()
      .transaction()
      .execute(async (trx) => {
        for (const attributionUuid of params.attributionUuids) {
          const existingAttribution = await trx
            .selectFrom('attribution')
            .select('is_external')
            .where('uuid', '=', attributionUuid)
            .executeTakeFirst();

          if (!existingAttribution) {
            throw new Error(`Attribution ${attributionUuid} does not exist`);
          }

          if (!existingAttribution.is_external) {
            throw new Error('Only external attributions can be resolved');
          }

          await trx
            .updateTable('attribution')
            .set({ is_resolved: Number(true) })
            .where('uuid', '=', attributionUuid)
            .execute();
        }
      });

    return {
      invalidates: params.attributionUuids.map((attributionUuid) => ({
        queryName: 'getAttributionData',
        params: { attributionUuid },
      })),
    };
  },
  async unresolveAttributions(params: { attributionUuids: Array<string> }) {
    await getDb()
      .transaction()
      .execute(async (trx) => {
        for (const attributionUuid of params.attributionUuids) {
          const existingAttribution = await trx
            .selectFrom('attribution')
            .select('is_external')
            .where('uuid', '=', attributionUuid)
            .executeTakeFirst();

          if (!existingAttribution) {
            throw new Error(`Attribution ${attributionUuid} does not exist`);
          }

          if (!existingAttribution.is_external) {
            throw new Error('Only external attributions can be unresolved');
          }

          await trx
            .updateTable('attribution')
            .set({ is_resolved: Number(false) })
            .where('uuid', '=', attributionUuid)
            .execute();
        }
      });

    return {
      invalidates: params.attributionUuids.map((attributionUuid) => ({
        queryName: 'getAttributionData',
        params: { attributionUuid },
      })),
    };
  },

  async unlinkResourceFromAttributions(params: {
    resourcePath: string;
    attributionUuids: Array<string>;
  }) {
    await getDb()
      .transaction()
      .execute(async (trx) => {
        const resourcePath = removeTrailingSlash(params.resourcePath);

        const existingResource = await trx
          .selectFrom('resource')
          .select('id')
          .where('path', '=', resourcePath)
          .executeTakeFirst();

        if (!existingResource) {
          throw new Error(`Resource with path ${resourcePath} does not exist`);
        }

        for (const attributionUuid of params.attributionUuids) {
          const existingAttribution = await trx
            .selectFrom('attribution')
            .select('is_external')
            .where('uuid', '=', attributionUuid)
            .executeTakeFirst();

          if (!existingAttribution) {
            throw new Error(`Attribution ${attributionUuid} does not exist`);
          }

          if (existingAttribution.is_external) {
            throw new Error(
              'Only manual attributions can be unlinked from resources',
            );
          }

          await trx
            .deleteFrom('resource_to_attribution')
            .where('resource_id', '=', existingResource.id)
            .where('attribution_uuid', '=', attributionUuid)
            .execute();
        }
      });

    return {
      invalidates: params.attributionUuids.map((attributionUuid) => ({
        queryName: 'getAttributionData',
        params: { attributionUuid },
      })),
    };
  },
} satisfies Record<string, MutationFunction>;

export type Mutations = typeof mutations;
export type MutationName = keyof Mutations;

export type MutationParams<C extends MutationName> =
  Parameters<Mutations[C]> extends [infer P] ? P : void;
export type MutationReturn<C extends MutationName> = ReturnType<Mutations[C]>;
export type MutationResult<C extends MutationName> =
  Awaited<MutationReturn<C>> extends { result: unknown }
    ? Awaited<MutationReturn<C>>['result']
    : void;
