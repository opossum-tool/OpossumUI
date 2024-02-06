// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { first, keyBy, ListIterator, orderBy } from 'lodash';

import {
  Attributions,
  Criticality,
  PackageInfo,
} from '../../shared/shared-types';
import { text } from '../../shared/text';
import { Sorting } from '../shared-constants';
import { getCardLabels } from './get-card-labels';

export function sortAttributions({
  attributions,
  sorting,
}: {
  attributions: Array<PackageInfo> | Attributions;
  sorting: Sorting;
}): Attributions {
  const iteratees: Array<ListIterator<PackageInfo, unknown>> = [
    (packageInfo) => first(getCardLabels(packageInfo))?.toLowerCase(),
  ];
  const orders: Array<'asc' | 'desc'> = ['asc'];

  if (sorting === text.sortings.criticality) {
    iteratees.unshift(({ criticality }) =>
      getNumericalCriticalityValue(criticality),
    );
    orders.unshift('desc');
  } else if (sorting === text.sortings.occurrence) {
    iteratees.unshift(({ count }) => count ?? 0);
    orders.unshift('desc');
  }

  const orderedAttributions = orderBy(
    Array.isArray(attributions) ? attributions : Object.values(attributions),
    iteratees,
    orders,
  );

  return keyBy(orderedAttributions, ({ id }) => id);
}

function getNumericalCriticalityValue(criticality: Criticality | undefined) {
  switch (criticality) {
    case Criticality.High:
      return 2;
    case Criticality.Medium:
      return 1;
    default:
      return 0;
  }
}
