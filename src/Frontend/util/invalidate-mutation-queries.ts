// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { QueryClient, QueryKey } from '@tanstack/react-query';

import type { MutationInvalidation } from '../../ElectronBackend/api/mutations';
import type { FocusedAttributionOutcome } from '../../shared/attribution-selection';

export function removeFocusedAttributionQuery({
  queryClient,
  outcome,
}: {
  queryClient: QueryClient;
  outcome: FocusedAttributionOutcome;
}): void {
  if (outcome.status === 'unchanged') {
    return;
  }

  queryClient.removeQueries({
    queryKey: [
      'backend',
      'getAttributionData',
      { attributionUuid: outcome.attributionUuid },
    ],
    exact: true,
  });
}

function queryKeyForInvalidation(invalidation: MutationInvalidation): QueryKey {
  return ['backend', invalidation.queryName];
}

export async function invalidateMutationQueries({
  queryClient,
  invalidations,
}: {
  queryClient: QueryClient;
  invalidations: Array<MutationInvalidation>;
}): Promise<void> {
  const awaitedInvalidations = invalidations.filter(
    ({ awaitRefetch }) => awaitRefetch,
  );
  const backgroundInvalidations = invalidations.filter(
    ({ awaitRefetch }) => !awaitRefetch,
  );

  await invalidateAll({ queryClient, invalidations: awaitedInvalidations });
  void invalidateAll({ queryClient, invalidations: backgroundInvalidations });
}

async function invalidateAll({
  queryClient,
  invalidations,
}: {
  queryClient: QueryClient;
  invalidations: Array<MutationInvalidation>;
}): Promise<void> {
  const invalidate = (invalidation: MutationInvalidation) =>
    queryClient.invalidateQueries(
      {
        queryKey: queryKeyForInvalidation(invalidation),
      },
      { throwOnError: true },
    );
  await Promise.all(
    invalidations.map((invalidation) =>
      invalidate(invalidation).catch((error) =>
        console.error('Failed to invalidate mutation queries.', {
          error,
          queryName: invalidation.queryName,
        }),
      ),
    ),
  );
}
