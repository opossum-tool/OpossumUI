// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { orderBy } from 'lodash-es';

import type {
  Attributions,
  PackageInfo,
  Relation,
} from '../../shared/shared-types';
import type { SortOption } from '../Components/SortButton/useSortingOptions';
import { getCardLabels } from './get-card-labels';

export function sortAttributions({
  attributions,
  sorting,
}: {
  attributions: Array<PackageInfo> | Attributions;
  sorting: SortOption;
}): Attributions {
  const iteratees: Array<(packageInfo: PackageInfo) => string | number> = [
    (packageInfo) => getCardLabels(packageInfo).join('').toLowerCase(),
  ];
  const orders: Array<'asc' | 'desc'> = ['asc'];

  if (sorting === 'criticality') {
    iteratees.unshift(({ criticality }) => criticality);
    orders.unshift('desc');
  } else if (sorting === 'occurrence') {
    iteratees.unshift(({ count }) => count ?? 0);
    orders.unshift('desc');
  } else if (sorting === 'classification') {
    iteratees.unshift(({ classification }) => classification ?? -1);
    orders.unshift('desc');
  }

  const orderedAttributions = orderBy(
    Array.isArray(attributions) ? attributions : Object.values(attributions),
    iteratees,
    orders,
  );

  return orderedAttributions.reduce<Attributions>((result, attribution) => {
    result[attribution.id] = attribution;
    return result;
  }, {});
}

export function getRelationPriority(relation: Relation | undefined): 2 | 1 | 0 {
  switch (relation) {
    case 'parents':
    case 'resource':
      return 2;
    case 'children':
      return 1;
    case 'unrelated':
    case undefined:
      return 0;
  }
}
