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
  getEffectiveManualAttributionUuids,
  getResourceOrThrow,
  linkAttributions,
  matchOrCreateAttributions,
  removeRedundantAttributions,
  replaceAttributions,
  uniqueAttributionUuids,
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

type QueryInvalidation<Q extends QueryName> = {
  queryName: Q;
  params?: QueryParams<Q>;
};

// Immediately Indexed Mapped Type: Ensures that queryName and params match
type QueryInvalidationUnion = {
  [Q in QueryName]: QueryInvalidation<Q>;
}[QueryName];

export type AttributionCacheImpact =
  { mode: 'targeted'; attributionUuids: Array<string> } | { mode: 'broad' };

export const MAX_TARGETED_CACHE_UUIDS = 1_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MutationFunction = (params?: any) => Promise<{
  result?: unknown;
  invalidates?: Array<QueryInvalidationUnion>;
  affectedAttributionUuids?: Array<string>;
  attributionCacheImpact?: AttributionCacheImpact;
}>;

function getAttributionCacheImpact(
  ...attributionUuidGroups: Array<Iterable<string>>
): AttributionCacheImpact {
  const attributionUuids = new Set<string>();
  for (const attributionUuidGroup of attributionUuidGroups) {
    for (const attributionUuid of attributionUuidGroup) {
      attributionUuids.add(attributionUuid);
      if (attributionUuids.size > MAX_TARGETED_CACHE_UUIDS) {
        return { mode: 'broad' };
      }
    }
  }

  return { mode: 'targeted', attributionUuids: [...attributionUuids] };
}

function getAttributionDetailInvalidations(
  attributionCacheImpact: AttributionCacheImpact,
): Array<QueryInvalidationUnion> {
  return attributionCacheImpact.mode === 'targeted'
    ? attributionCacheImpact.attributionUuids.map((attributionUuid) => ({
        queryName: 'getAttributionData' as const,
        params: { attributionUuid },
      }))
    : [{ queryName: 'getAttributionData' }];
}

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
  { queryName: 'getAttributions' },
  { queryName: 'listAttributionRelationCounts' },
  { queryName: 'filterProperties' },
  { queryName: 'licenseTable' },
  { queryName: 'autoCompleteOptions' },
  { queryName: 'listAttributionsPage' },
  { queryName: 'getAttributionSelectionSummary' },
];

const MANUAL_ATTRIBUTION_INVALIDATIONS: Array<QueryInvalidationUnion> = [
  { queryName: 'manualAttributionStatistics' },
  { queryName: 'resourceHasIncompleteManualAttributions' },
];

const EXTERNAL_ATTRIBUTION_INVALIDATIONS: Array<QueryInvalidationUnion> = [
  { queryName: 'externalAttributionStatistics' },
  { queryName: 'resolvedAttributionUuids' },
];

const RESOURCE_TREE_INVALIDATIONS: Array<QueryInvalidationUnion> = [
  { queryName: 'getResourceTree' },
  { queryName: 'getResourcePathsAndParentsForAttributions' },
  { queryName: 'getResourceTreeUnreviewedCount' },
];

export const mutations = {
  invalidateGetAttributionData() {
    // to avoid typescript errors in backendClient, we need at least one mutation with no parameters, and an invalidation without parameters
    return Promise.resolve({
      invalidates: [{ queryName: 'getAttributionData' }],
    });
  },
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

        const effectiveAttributionUuidsBefore =
          await getEffectiveManualAttributionUuids(trx, [...impactedResources]);

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

        const redundantAttributionUuids = await removeRedundantAttributions(
          trx,
          {
            resourceIds: Array.from(impactedResources),
          },
        );
        const effectiveAttributionUuidsAfter =
          await getEffectiveManualAttributionUuids(trx, [...impactedResources]);
        return {
          attributionUuids,
          oldUuidsToNewUuids,
          redundantAttributionUuids,
          effectiveAttributionUuidsBefore,
          effectiveAttributionUuidsAfter,
          focusedAttributionOutcome: getFocusedAttributionRemovalOutcome(
            params.focusedAttributionUuid,
            attributionUuids,
          ),
        };
      });

    const attributionCacheImpact = getAttributionCacheImpact(
      result.attributionUuids,
      Object.values(result.oldUuidsToNewUuids),
      result.redundantAttributionUuids,
      result.effectiveAttributionUuidsBefore,
      result.effectiveAttributionUuidsAfter,
    );
    return {
      invalidates: [
        ...getAttributionDetailInvalidations(attributionCacheImpact),
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        { queryName: 'getResourceInfoOnAttributions' },
      ],
      result: {
        focusedAttributionOutcome: result.focusedAttributionOutcome,
      },
      attributionCacheImpact,
    };
  },

  async replaceAttributions(params: {
    attributionUuidsToReplace?: Array<string>;
    selection?: AttributionSelection;
    attributionUuidToReplaceWith: string;
  }) {
    const result = await getDb()
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

    const attributionCacheImpact = getAttributionCacheImpact(
      result.affectedAttributionUuids,
    );
    return {
      invalidates: [
        ...getAttributionDetailInvalidations(attributionCacheImpact),
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        { queryName: 'getResourceInfoOnAttributions' },
      ],
      attributionCacheImpact,
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
        { queryName: 'getAttributionData' },
        ...Object.keys(params.attributions).map((attributionUuid) => ({
          queryName: 'getAttributionData' as const,
          params: { attributionUuid },
        })),
        { queryName: 'getResourceInfoOnAttributions' },
      ],
      result: {
        focusedAttributionOutcome: result.focusedAttributionOutcome,
      },
      affectedAttributionUuids: uniqueAttributionUuids(
        Object.keys(params.attributions),
        Object.values(result.oldUuidsToNewUuids),
      ),
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
        return { attributionUuids, oldUuidsToNewUuids };
      });
    const attributionCacheImpact = getAttributionCacheImpact(
      result.attributionUuids,
      Object.values(result.oldUuidsToNewUuids),
    );
    return {
      invalidates: [
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...getAttributionDetailInvalidations(attributionCacheImpact),
        { queryName: 'getResourceInfoOnAttributions' },
      ],
      result: {
        focusedAttributionOutcome: getFocusedAttributionRemappingOutcome(
          params.focusedAttributionUuid,
          result.oldUuidsToNewUuids,
        ),
      },
      attributionCacheImpact,
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
        const effectiveAttributionUuidsBefore =
          await getEffectiveManualAttributionUuids(trx, [resource.id]);
        await removeManualOrExternalCaaFromResources(trx, 'manual', {
          attributionUuids,
          resourceIds: [resource.id],
        });

        await ensureAttributionsAreNotExternal(trx, attributionUuids);

        await unlinkAttributions(trx, resource.id, attributionUuids);

        const redundantAttributionUuids = await removeRedundantAttributions(
          trx,
          { resourceIds: [resource.id] },
        );
        const effectiveAttributionUuidsAfter =
          await getEffectiveManualAttributionUuids(trx, [resource.id]);
        return {
          attributionUuids,
          redundantAttributionUuids,
          effectiveAttributionUuidsBefore,
          effectiveAttributionUuidsAfter,
          focusedAttributionOutcome: getFocusedAttributionRemovalOutcome(
            params.focusedAttributionUuid,
            attributionUuids,
          ),
        };
      });

    const attributionCacheImpact = getAttributionCacheImpact(
      result.attributionUuids,
      result.redundantAttributionUuids,
      result.effectiveAttributionUuidsBefore,
      result.effectiveAttributionUuidsAfter,
    );
    return {
      invalidates: [
        ...getAttributionDetailInvalidations(attributionCacheImpact),
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        { queryName: 'getResourceInfoOnAttributions' } as const,
      ],
      result: {
        focusedAttributionOutcome: result.focusedAttributionOutcome,
      },
      attributionCacheImpact,
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
        const effectiveAttributionUuidsBefore =
          await getEffectiveManualAttributionUuids(trx, [resource.id]);
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

        const redundantAttributionUuids = await removeRedundantAttributions(
          trx,
          { resourceIds: [resource.id] },
        );

        const effectiveAttributionUuidsAfter =
          await getEffectiveManualAttributionUuids(trx, [resource.id]);

        return {
          inputUuids,
          oldUuidsToNewUuids,
          redundantAttributionUuids,
          effectiveAttributionUuidsBefore,
          effectiveAttributionUuidsAfter,
        };
      });
    const attributionCacheImpact = getAttributionCacheImpact(
      result.inputUuids,
      Object.values(result.oldUuidsToNewUuids),
      result.redundantAttributionUuids,
      result.effectiveAttributionUuidsBefore,
      result.effectiveAttributionUuidsAfter,
    );
    return {
      invalidates: [
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...getAttributionDetailInvalidations(attributionCacheImpact),
        { queryName: 'getResourceInfoOnAttributions' },
      ],
      result: {
        focusedAttributionOutcome: getFocusedAttributionRemappingOutcome(
          params.focusedAttributionUuid,
          result.oldUuidsToNewUuids,
        ),
      },
      attributionCacheImpact,
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
        const effectiveAttributionUuidsBefore =
          await getEffectiveManualAttributionUuids(trx, [resource.id]);

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

        const redundantAttributionUuids = await removeRedundantAttributions(
          trx,
          { resourceIds: [resource.id] },
        );

        const effectiveAttributionUuidsAfter =
          await getEffectiveManualAttributionUuids(trx, [resource.id]);

        return {
          inputKeysToNewUuids,
          redundantAttributionUuids,
          effectiveAttributionUuidsBefore,
          effectiveAttributionUuidsAfter,
        };
      });

    const attributionCacheImpact = getAttributionCacheImpact(
      Object.values(result.inputKeysToNewUuids),
      result.redundantAttributionUuids,
      result.effectiveAttributionUuidsBefore,
      result.effectiveAttributionUuidsAfter,
    );
    return {
      invalidates: [
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...getAttributionDetailInvalidations(attributionCacheImpact),
        { queryName: 'getResourceInfoOnAttributions' },
      ],
      result: {
        focusedAttributionOutcome: getFocusedAttributionRemappingOutcome(
          params.focusedAttributionUuid,
          result.inputKeysToNewUuids,
        ),
      },
      attributionCacheImpact,
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
        const { inputUuids, attributions } =
          await resolveAttributionsWithOverrides(trx, params);
        const oldUuidsToNewUuids: Record<string, string> = {};
        const affectedAttributionUuids: Array<string> = [];
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
            const replacementResult = await replaceAttributions(trx, {
              attributionUuidsToReplace: [writableAttributionUuid],
              attributionUuidToReplaceWith: matchingAttributionUuid,
            });
            affectedAttributionUuids.push(
              ...replacementResult.affectedAttributionUuids,
            );
            oldUuidsToNewUuids[attributionUuid] = matchingAttributionUuid;
          } else {
            await updateAttribution(trx, writableAttributionUuid, {
              ...newPackageInfo,
              id: writableAttributionUuid,
            });
            oldUuidsToNewUuids[attributionUuid] = writableAttributionUuid;
          }
        }
        return { inputUuids, oldUuidsToNewUuids, affectedAttributionUuids };
      });
    const attributionCacheImpact = getAttributionCacheImpact(
      result.inputUuids,
      Object.values(result.oldUuidsToNewUuids),
      result.affectedAttributionUuids,
    );
    return {
      invalidates: [
        ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
        ...MANUAL_ATTRIBUTION_INVALIDATIONS,
        ...RESOURCE_TREE_INVALIDATIONS,
        ...getAttributionDetailInvalidations(attributionCacheImpact),
        { queryName: 'getResourceInfoOnAttributions' },
      ],
      result: {
        focusedAttributionOutcome: getFocusedAttributionRemappingOutcome(
          params.focusedAttributionUuid,
          result.oldUuidsToNewUuids,
        ),
      },
      attributionCacheImpact,
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
  const attributionUuids = await getDb()
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
      return attributionUuids;
    });
  const attributionCacheImpact = getAttributionCacheImpact(attributionUuids);
  return {
    invalidates: [
      ...ATTRIBUTION_AGGREGATE_INVALIDATIONS,
      ...EXTERNAL_ATTRIBUTION_INVALIDATIONS,
      ...getAttributionDetailInvalidations(attributionCacheImpact),
      { queryName: 'getResourceTree' } as const,
    ],
    attributionCacheImpact,
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
