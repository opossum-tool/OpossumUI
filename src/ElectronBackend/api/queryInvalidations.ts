// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-License-Identifier: Apache-2.0
import { getDb } from '../db/db';
import type { MutationInvalidation } from './mutations';
import type { QueryName } from './queries';
import { invalidateFilteredResourcesCache } from './resourceTree';

const cacheInvalidators: Partial<Record<QueryName, () => void>> = {
  getResourceTree: () => invalidateFilteredResourcesCache(getDb()),
};

export function invalidateBackendQueryCaches(
  invalidations: ReadonlyArray<MutationInvalidation>,
) {
  for (const { queryName } of invalidations) {
    cacheInvalidators[queryName]?.();
  }
}
