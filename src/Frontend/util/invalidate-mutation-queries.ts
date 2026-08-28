// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { QueryClient, QueryKey } from '@tanstack/react-query';

import type { MutationInvalidationUnion } from '../../ElectronBackend/api/mutations';

function queryKeyForInvalidation(
  invalidation: MutationInvalidationUnion,
): QueryKey {
  return invalidation.params === undefined
    ? ['backend', invalidation.queryName]
    : ['backend', invalidation.queryName, invalidation.params];
}

export async function invalidateMutationQueries({
  queryClient,
  invalidations,
}: {
  queryClient: QueryClient;
  invalidations: Array<MutationInvalidationUnion>;
}): Promise<void> {
  await invalidateAll({ queryClient, invalidations, awaitRefetch: true });
  void invalidateAll({ queryClient, invalidations, awaitRefetch: false });
}

async function invalidateAll({
  queryClient,
  invalidations,
  awaitRefetch,
}: {
  queryClient: QueryClient;
  invalidations: Array<MutationInvalidationUnion>;
  awaitRefetch: boolean;
}): Promise<void> {
  const invalidate = (invalidation: MutationInvalidationUnion) =>
    queryClient.invalidateQueries(
      {
        queryKey: queryKeyForInvalidation(invalidation),
        exact: invalidation.params !== undefined,
      },
      { throwOnError: true },
    );
  await Promise.all(
    invalidations
      .filter((invalidation) => !!invalidation.awaitRefetch === awaitRefetch)
      .map(invalidate),
  ).catch((error) =>
    console.error('Failed to invalidate mutation queries.', error),
  );
}
