// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Kysely } from 'kysely';
import { omit } from 'lodash-es';

import {
  type AttributionSelection,
  excludeAttributionFromAllMatchingSelection,
  type FocusedAttributionOutcome,
} from '../../shared/attribution-selection';
import type { Attributions } from '../../shared/shared-types';
import { packageInfoFromAttributionRow } from '../db/attributionData';
import { getDb } from '../db/db';
import type { DB } from '../db/generated/databaseTypes';
import { resolveAttributionSelection } from './listAttributionsPage';
import {
  addManualOrExternalCaaToResources,
  removeManualOrExternalCaaFromResources,
} from './progressBarUtils';
import type { QueryName, QueryParams } from './queries';
import {
  cloneMixedAttributionsForWritableResources,
  ensureAttributionsAreLinkedOnMultipleResources,
  ensureAttributionsAreNotExternal,
  ensureAttributionsAreNotReadonly,
  ensureResourceIsWritable,
  findMatchingAttributionUuid,
  getResourceOrThrow,
  linkAttributions,
  matchOrCreateAttributions,
  removeRedundantAttributions,
  replaceAttributions,
  unlinkAttributions,
  updateAttribution,
  withBatching,
} from './utils';

type AttributionSelectionParams =
  { attributionUuids: Array<string> } | { selection: AttributionSelection };

type AttributionSelectionWithFocus = AttributionSelectionParams & {
  focusedAttributionUuid?: string;
};

function getFocusedAttributionRemappingOutcome(
  focusedAttributionUuid: string | undefined,
  oldUuidsToNewUuids: Record<string, string>,
): FocusedAttributionOutcome {
  if (focusedAttributionUuid === undefined) {
    return { status: 'unchanged' };
  }
  const newAttributionUuid = oldUuidsToNewUuids[focusedAttributionUuid];
  return newAttributionUuid !== undefined &&
    newAttributionUuid !== focusedAttributionUuid
    ? {
        status: 'remapped',
        attributionUuid: focusedAttributionUuid,
        newAttributionUuid,
      }
    : { status: 'unchanged' };
}

function getFocusedAttributionRemovalOutcome(
  focusedAttributionUuid: string | undefined,
  attributionUuids: Array<string>,
): FocusedAttributionOutcome {
  return focusedAttributionUuid !== undefined &&
    attributionUuids.includes(focusedAttributionUuid)
    ? { status: 'removed', attributionUuid: focusedAttributionUuid }
    : { status: 'unchanged' };
}

async function resolveSelection(
  trx: Kysely<DB>,
  params: AttributionSelectionParams,
) {
  return 'selection' in params
    ? resolveAttributionSelection(trx, params.selection)
    : params.attributionUuids;
}

async function getAttributionsByUuid(trx: Kysely<DB>, uuids: Array<string>) {
  return (
    await withBatching(uuids, async (batch) => {
      if (batch === undefined || batch.length === 0) {
        return [];
      }
      return trx
        .selectFrom('attribution')
        .selectAll()
        .where('uuid', 'in', batch)
        .execute();
    })
  ).flat();
}

async function resolveAttributionsWithOverrides(
  trx: Kysely<DB>,
  params: {
    attributions?: Attributions;
    selection?: AttributionSelection;
  },
) {
  const inputUuids = params.selection
    ? await resolveSelection(trx, { selection: params.selection })
    : Object.keys(params.attributions ?? {});

  if (!params.selection) {
    return {
      inputUuids,
      attributions: params.attributions ?? {},
    };
  }

  const persistedAttributions = Object.fromEntries(
    (await getAttributionsByUuid(trx, inputUuids)).map((row) => [
      row.uuid,
      packageInfoFromAttributionRow(row),
    ]),
  );
  const overrides = params.attributions ?? {};

  return {
    inputUuids,
    attributions: Object.fromEntries(
      inputUuids.flatMap((uuid) => {
        const attribution = overrides[uuid] ?? persistedAttributions[uuid];
        return attribution ? [[uuid, attribution]] : [];
      }),
    ),
  };
}

type MutationInvalidation<Q extends QueryName = QueryName> = {
  queryName: Q;
  params?: QueryParams<Q>;
  awaitRefetch?: boolean;
};

// Immediately Indexed Mapped Type: Ensures that queryName and params match
export type MutationInvalidationUnion = {
  [Q in QueryName]: MutationInvalidation<Q>;
}[QueryName];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MutationFunction = (params?: any) => Promise<{
  result?: unknown;
  invalidates?: Array<MutationInvalidationUnion>;
}>;

const PROGRESS_BAR_INVALIDATIONS: Array<MutationInvalidationUnion> = [
  { queryName: 'getAttributionProgressBarData' },
  { queryName: 'getNextFileToReviewForAttribution' },
  { queryName: 'getCriticalityProgressBarData' },
  { queryName: 'getNextFileToReviewForCriticality' },
  { queryName: 'getClassificationProgressBarData' },
  { queryName: 'getNextFileToReviewForClassification' },
];

const ATTRIBUTION_AGGREGATE_INVALIDATIONS: Array<MutationInvalidationUnion> = [
  ...PROGRESS_BAR_INVALIDATIONS,
  { queryName: 'getAttributionData', awaitRefetch: true },
  { queryName: 'getAttributions' },
  { queryName: 'listAttributionRelationCounts' },
  { queryName: 'filterProperties' },
  { queryName: 'licenseTable' },
  { queryName: 'autoCompleteOptions' },
  { queryName: 'listAttributionsPage', awaitRefetch: true },
  { queryName: 'getAttributionSelectionSummary' },
  { queryName: 'locateAttribution' },
];

const MANUAL_ATTRIBUTION_INVALIDATIONS: Array<MutationInvalidationUnion> = [
  { queryName: 'manualAttributionStatistics' },
  { queryName: 'resourceHasIncompleteManualAttributions' },
];

const EXTERNAL_ATTRIBUTION_INVALIDATIONS: Array<MutationInvalidationUnion> = [
  { queryName: 'externalAttributionStatistics' },
  { queryName: 'resolvedAttributionUuids', awaitRefetch: true },
];

const RESOURCE_TREE_INVALIDATIONS: Array<MutationInvalidationUnion> = [
  { queryName: 'getResourceTree' },
  { queryName: 'getResourcePathsAndParentsForAttributions' },
  { queryName: 'getResourceTreeUnreviewedCount' },
];

export const mutations = {
  async deleteAttributions(params: AttributionSelectionWithFocus) {
    const result = await getDb()
      .transaction()
      .execute(async (trx) => {
        const attributionUuids = await resolveSelection(trx, params);
        const oldUuidsToNewUuids =
          await cloneMixedAttributionsForWritableResources(
            trx,
            attributionUuids,
          );
        const writableAttributionUuids = attributionUuids.map(
          (attributionUuid) => oldUuidsToNewUuids[attributionUuid],
        );
        await ensureAttributionsAreNotExternal(trx, writableAttributionUuids);
        const impactedResources = new Set(
          (
            await withBatching(writableAttributionUuids, async (batch) => {
              if (!batch?.length) {
                return [];
              }
              return trx
                .selectFrom('resource_to_attribution')
                .select('resource_id')
                .where('attribution_uuid', 'in', batch)
                .execute();
            })
          )
            .flat()
            .map((row) => row.resource_id),
        );

        await removeManualOrExternalCaaFromResources(trx, 'manual', {
          attributionUuids: writableAttributionUuids,
        });

        await withBatching(writableAttributionUuids, async (batch) => {
          if (!batch?.length) {
            return;
          }
          await trx
            .deleteFrom('attribution')
            .where('uuid', 'in', batch)
            .execute();
        });

        await removeRedundantAttributions(trx, {
          resourceIds: Array.from(impactedResources),
        });
        return {
          oldUuidsToNewUuids,
          focusedAttributionOutcome: getFocusedAttributionRemovalOutcome(
            params.focusedAttributionUuid,
            attributionUuids,
          ),
        };
      });

    return {
      invalidates: [
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        { queryName: 'getResourceInfoOnAttributions' },
      ],
      result: {
        focusedAttributionOutcome: result.focusedAttributionOutcome,
      },
    };
  },

  async replaceAttributions(params: {
    attributionUuidsToReplace?: Array<string>;
    selection?: AttributionSelection;
    attributionUuidToReplaceWith: string;
  }) {
    await getDb()
      .transaction()
      .execute(async (trx) => {
        const selection = params.selection
          ? excludeAttributionFromAllMatchingSelection(
              params.selection,
              params.attributionUuidToReplaceWith,
            )
          : undefined;
        const attributionUuidsToReplace = await resolveSelection(trx, {
          ...(selection
            ? { selection }
            : { attributionUuids: params.attributionUuidsToReplace ?? [] }),
        });
        if (
          attributionUuidsToReplace.includes(
            params.attributionUuidToReplaceWith,
          )
        ) {
          throw new Error('An attribution cannot replace itself.');
        }
        return replaceAttributions(trx, {
          ...params,
          attributionUuidsToReplace,
        });
      });

    return {
      invalidates: [
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        { queryName: 'getResourceInfoOnAttributions' },
      ],
    };
  },

  async updateAttributions(params: {
    attributions: Attributions;
    focusedAttributionUuid?: string;
  }) {
    const result = await getDb()
      .transaction()
      .execute(async (trx) => {
        const oldUuidsToNewUuids =
          await cloneMixedAttributionsForWritableResources(
            trx,
            Object.keys(params.attributions),
          );
        for (const [attributionUuid, attributionData] of Object.entries(
          params.attributions,
        )) {
          const writableAttributionUuid = oldUuidsToNewUuids[attributionUuid];
          await updateAttribution(trx, writableAttributionUuid, {
            ...attributionData,
            id: writableAttributionUuid,
          });
        }
        return {
          oldUuidsToNewUuids,
          focusedAttributionOutcome: getFocusedAttributionRemappingOutcome(
            params.focusedAttributionUuid,
            oldUuidsToNewUuids,
          ),
        };
      });

    return {
      invalidates: [
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        { queryName: 'getResourceInfoOnAttributions' },
      ],
      result: {
        focusedAttributionOutcome: result.focusedAttributionOutcome,
      },
    };
  },

  async updateAttributionProperty(params: {
    selection: AttributionSelection;
    property: 'needsReview' | 'followUp' | 'excludeFromNotice';
    value: boolean;
    attributions?: Attributions;
    focusedAttributionUuid?: string;
  }) {
    const result = await getDb()
      .transaction()
      .execute(async (trx) => {
        const attributionUuids = await resolveSelection(trx, params);
        const oldUuidsToNewUuids =
          await cloneMixedAttributionsForWritableResources(
            trx,
            attributionUuids,
          );
        const writableAttributionUuids = attributionUuids.map(
          (uuid) => oldUuidsToNewUuids[uuid] ?? uuid,
        );
        const update =
          params.property === 'needsReview'
            ? { needs_review: Number(params.value) }
            : params.property === 'followUp'
              ? { follow_up: Number(params.value) }
              : { exclude_from_notice: Number(params.value) };
        await withBatching(writableAttributionUuids, async (batch) => {
          if (!batch?.length) {
            return;
          }
          await trx
            .updateTable('attribution')
            .set(update)
            .where('uuid', 'in', batch)
            .execute();
        });

        const focusedAttribution =
          params.focusedAttributionUuid !== undefined
            ? params.attributions?.[params.focusedAttributionUuid]
            : undefined;
        const focusedAttributionWritableUuid =
          params.focusedAttributionUuid !== undefined
            ? oldUuidsToNewUuids[params.focusedAttributionUuid]
            : undefined;
        if (focusedAttribution && focusedAttributionWritableUuid) {
          await updateAttribution(trx, focusedAttributionWritableUuid, {
            ...focusedAttribution,
            [params.property]: params.value,
            id: focusedAttributionWritableUuid,
          });
        }
        return { oldUuidsToNewUuids };
      });
    return {
      invalidates: [
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        { queryName: 'getResourceInfoOnAttributions' },
      ],
      result: {
        focusedAttributionOutcome: getFocusedAttributionRemappingOutcome(
          params.focusedAttributionUuid,
          result.oldUuidsToNewUuids,
        ),
      },
    };
  },

  async unlinkResourceFromAttributions(params: {
    resourcePath: string;
    attributionUuids?: Array<string>;
    selection?: AttributionSelection;
    focusedAttributionUuid?: string;
  }) {
    const result = await getDb()
      .transaction()
      .execute(async (trx) => {
        const attributionUuids = await resolveSelection(trx, {
          ...(params.selection
            ? { selection: params.selection }
            : { attributionUuids: params.attributionUuids ?? [] }),
        });
        const resource = await getResourceOrThrow(trx, params.resourcePath);
        ensureResourceIsWritable(resource);
        await removeManualOrExternalCaaFromResources(trx, 'manual', {
          attributionUuids,
          resourceIds: [resource.id],
        });

        await ensureAttributionsAreNotExternal(trx, attributionUuids);

        await unlinkAttributions(trx, resource.id, attributionUuids);

        await removeRedundantAttributions(trx, { resourceIds: [resource.id] });
        return {
          focusedAttributionOutcome: getFocusedAttributionRemovalOutcome(
            params.focusedAttributionUuid,
            attributionUuids,
          ),
        };
      });

    return {
      invalidates: [
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        { queryName: 'getResourceInfoOnAttributions' } as const,
      ],
      result: {
        focusedAttributionOutcome: result.focusedAttributionOutcome,
      },
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
    attributions?: Attributions;
    selection?: AttributionSelection;
    focusedAttributionUuid?: string;
  }) {
    const result = await getDb()
      .transaction()
      .execute(async (trx) => {
        const resource = await getResourceOrThrow(trx, params.resourcePath);
        ensureResourceIsWritable(resource);
        const { inputUuids, attributions } =
          await resolveAttributionsWithOverrides(trx, params);
        await ensureAttributionsAreNotExternal(trx, inputUuids);
        await ensureAttributionsAreLinkedOnMultipleResources(trx, inputUuids);

        await unlinkAttributions(trx, resource.id, inputUuids);

        const oldUuidsToNewUuids = await matchOrCreateAttributions(
          trx,
          attributions,
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

        return {
          oldUuidsToNewUuids,
        };
      });
    return {
      invalidates: [
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        { queryName: 'getResourceInfoOnAttributions' },
      ],
      result: {
        focusedAttributionOutcome: getFocusedAttributionRemappingOutcome(
          params.focusedAttributionUuid,
          result.oldUuidsToNewUuids,
        ),
      },
    };
  },

  async createOrMatchAttributions(params: {
    resourcePath: string;
    attributions?: Attributions;
    selection?: AttributionSelection;
    focusedAttributionUuid?: string;
  }) {
    const result = await getDb()
      .transaction()
      .execute(async (trx) => {
        const selectionUuids = params.selection
          ? await resolveSelection(trx, { selection: params.selection })
          : [];
        const attributions = params.attributions
          ? params.attributions
          : Object.fromEntries(
              (await getAttributionsByUuid(trx, selectionUuids)).map((row) => [
                row.uuid,
                packageInfoFromAttributionRow(row),
              ]),
            );
        const resource = await getResourceOrThrow(trx, params.resourcePath);
        ensureResourceIsWritable(resource);
        const inputKeysToNewUuids = await matchOrCreateAttributions(
          trx,
          attributions,
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

        return {
          inputKeysToNewUuids,
        };
      });

    return {
      invalidates: [
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        { queryName: 'getResourceInfoOnAttributions' },
      ],
      result: {
        focusedAttributionOutcome: getFocusedAttributionRemappingOutcome(
          params.focusedAttributionUuid,
          result.inputKeysToNewUuids,
        ),
      },
    };
  },

  async updateOrMatchAttributions(params: {
    attributions?: Attributions;
    selection?: AttributionSelection;
    focusedAttributionUuid?: string;
  }) {
    const result = await getDb()
      .transaction()
      .execute(async (trx) => {
        const { attributions } = await resolveAttributionsWithOverrides(
          trx,
          params,
        );
        const oldUuidsToNewUuids: Record<string, string> = {};
        for (const [attributionUuid, attributionData] of Object.entries(
          attributions,
        )) {
          const splitUuids = await cloneMixedAttributionsForWritableResources(
            trx,
            [attributionUuid],
          );
          const writableAttributionUuid = splitUuids[attributionUuid];
          // Updating an attribution always removes preselected
          const newPackageInfo = omit(attributionData, 'preSelected');
          const matchingAttributionUuid = await findMatchingAttributionUuid(
            trx,
            newPackageInfo,
            {
              excludeUuids: [attributionUuid, writableAttributionUuid],
            },
          );
          if (matchingAttributionUuid) {
            await replaceAttributions(trx, {
              attributionUuidsToReplace: [writableAttributionUuid],
              attributionUuidToReplaceWith: matchingAttributionUuid,
            });
            oldUuidsToNewUuids[attributionUuid] = matchingAttributionUuid;
          } else {
            await updateAttribution(trx, writableAttributionUuid, {
              ...newPackageInfo,
              id: writableAttributionUuid,
            });
            oldUuidsToNewUuids[attributionUuid] = writableAttributionUuid;
          }
        }
        return { oldUuidsToNewUuids };
      });
    return {
      invalidates: [
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        { queryName: 'getResourceInfoOnAttributions' },
      ],
      result: {
        focusedAttributionOutcome: getFocusedAttributionRemappingOutcome(
          params.focusedAttributionUuid,
          result.oldUuidsToNewUuids,
        ),
      },
    };
  },

  async resolveAttributions(params: AttributionSelectionParams) {
    return setAttributionsResolvedStatus(params, true);
  },

  async unresolveAttributions(params: AttributionSelectionParams) {
    return setAttributionsResolvedStatus(params, false);
  },
} satisfies Record<string, MutationFunction>;

async function setAttributionsResolvedStatus(
  params: AttributionSelectionParams,
  resolvedStatus: boolean,
) {
  await getDb()
    .transaction()
    .execute(async (trx) => {
      const attributionUuids = await resolveSelection(trx, params);
      await ensureAttributionsAreNotReadonly(trx, attributionUuids);
      await withBatching(
        attributionUuids,
        async (batch) => {
          if (batch === undefined) {
            return;
          }
          if (resolvedStatus) {
            await removeManualOrExternalCaaFromResources(trx, 'external', {
              attributionUuids: batch,
            });
          } else {
            await addManualOrExternalCaaToResources(trx, 'external', {
              attributionUuids: batch,
            });
          }

          const existingAttributions = await trx
            .selectFrom('attribution')
            .select((eb) => eb.fn.countAll<number>().as('count'))
            .where('uuid', 'in', batch)
            .where('is_external', '=', 1)
            .executeTakeFirstOrThrow();

          if (existingAttributions.count !== batch.length) {
            throw new Error(
              `Expected to set ${batch.length} to ${resolvedStatus ? 'resolved' : 'unresolved'}, but only ${existingAttributions.count} were found`,
            );
          }

          await trx
            .updateTable('attribution')
            .set({ is_resolved: Number(resolvedStatus) })
            .where('uuid', 'in', batch)
            .execute();
        },
        // The main problem is updating the caa table, which can only take 15_000 attributionUuids
        { batchSize: 15_000 },
      );
    });
  return {
    invalidates: [
      ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
      ...EXTERNAL_ATTRIBUTION_INVALIDATIONS,
      { queryName: 'getResourceTree' } as const,
    ],
  };
}

type Mutations = typeof mutations;
export type MutationName = keyof Mutations;

export type MutationParams<C extends MutationName> =
  Parameters<Mutations[C]> extends [infer P] ? P : void;
export type MutationReturn<C extends MutationName> = ReturnType<Mutations[C]>;
export type MutationResult<C extends MutationName> =
  Awaited<MutationReturn<C>> extends { result: unknown }
    ? Awaited<MutationReturn<C>>['result']
    : void;
