// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { QueryClient, QueryKey } from '@tanstack/react-query';

import type {
  MutationInvalidationUnion,
  MutationName,
} from '../../ElectronBackend/api/mutations';
import { traceFrontendPhase } from './frontend-performance-tracing';

function queryKeyForInvalidation(
  invalidation: MutationInvalidationUnion,
): QueryKey {
  return invalidation.params === undefined
    ? ['backend', invalidation.queryName]
    : ['backend', invalidation.queryName, invalidation.params];
}

export async function invalidateMutationQueries({
  queryClient,
  mutation,
  invalidations,
}: {
  queryClient: QueryClient;
  mutation: MutationName;
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

  await traceFrontendPhase(
    'mutation.invalidate-awaited',
    { mutation, queryCount: awaited.length },
    () => Promise.all(awaited.map(invalidate)).then(() => undefined),
  ).catch(() => undefined);

  void traceFrontendPhase(
    'mutation.invalidate-background',
    { mutation, queryCount: background.length },
    () => Promise.all(background.map(invalidate)).then(() => undefined),
  ).catch(() => undefined);
}
