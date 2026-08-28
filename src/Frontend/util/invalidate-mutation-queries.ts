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
  const awaited = invalidations.filter(
    (invalidation) => invalidation.awaitRefetch === true,
  );
  const background = invalidations.filter(
    (invalidation) => invalidation.awaitRefetch !== true,
  );

  const invalidate = (invalidation: MutationInvalidationUnion) =>
    queryClient.invalidateQueries({
      queryKey: queryKeyForInvalidation(invalidation),
      exact: invalidation.params !== undefined,
    });

  await Promise.all(awaited.map(invalidate)).catch(() => undefined);

  void Promise.all(background.map(invalidate))
    .then(() => undefined)
    .catch(() => undefined);
}
