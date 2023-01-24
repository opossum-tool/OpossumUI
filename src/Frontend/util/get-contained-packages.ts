// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  AttributionIdWithCount,
  Attributions,
  PackageInfo,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import { getAttributedChildren } from './get-attributed-children';

export type PanelAttributionData = Pick<
  AttributionData,
  'attributions' | 'resourcesToAttributions' | 'resourcesWithAttributedChildren'
>;

export function getExternalAttributionIdsWithCount(
  attributionIds: Array<string>
): Array<AttributionIdWithCount> {
  return attributionIds.map((attributionId) => ({
    attributionId,
  }));
}

export function getContainedExternalPackages(args: {
  selectedResourceId: string;
  externalData: Readonly<PanelAttributionData>;
  resolvedExternalAttributions: Readonly<Set<string>>;
}): Array<AttributionIdWithCount> {
  const externalAttributedChildren = getAttributedChildren(
    args.externalData.resourcesWithAttributedChildren,
    args.selectedResourceId
  );

  return computeAggregatedAttributionsFromChildren(
    args.externalData.attributions,
    args.externalData.resourcesToAttributions,
    externalAttributedChildren,
    args.resolvedExternalAttributions
  );
}

export function getContainedManualPackages(args: {
  selectedResourceId: string;
  manualData: Readonly<PanelAttributionData>;
}): Array<AttributionIdWithCount> {
  const manualAttributedChildren = getAttributedChildren(
    args.manualData.resourcesWithAttributedChildren,
    args.selectedResourceId
  );

  return computeAggregatedAttributionsFromChildren(
    args.manualData.attributions,
    args.manualData.resourcesToAttributions,
    manualAttributedChildren
  );
}

// exported for testing
export function computeAggregatedAttributionsFromChildren(
  attributions: Readonly<Attributions>,
  resourcesToAttributions: Readonly<ResourcesToAttributions>,
  attributedChildren: Readonly<Set<string>>,
  resolvedExternalAttributions?: Readonly<Set<string>>
): Array<AttributionIdWithCount> {
  const attributionCount: { [attributionId: string]: number } = {};
  attributedChildren.forEach((child: string) => {
    resourcesToAttributions[child].forEach((attributionId: string) => {
      if (
        !resolvedExternalAttributions ||
        !resolvedExternalAttributions.has(attributionId)
      ) {
        attributionCount[attributionId] =
          (attributionCount[attributionId] || 0) + 1;
      }
    });
  });

  return Object.keys(attributionCount)
    .map((attributionId: string) => ({
      attributionId,
      count: attributionCount[attributionId],
    }))
    .sort(sortByCountAndPackageName(attributions));
}

export function sortByCountAndPackageName(
  attributions: Readonly<Attributions>
) {
  return function (
    a1: AttributionIdWithCount,
    a2: AttributionIdWithCount
  ): number {
    if (a1.count && a2.count && a1.count !== a2.count) {
      return a2.count - a1.count;
    }

    const p1: PackageInfo = attributions[a1.attributionId];
    const p2: PackageInfo = attributions[a2.attributionId];
    if (p1?.packageName && p2?.packageName) {
      return p1.packageName.toLowerCase() < p2.packageName.toLowerCase()
        ? -1
        : 1;
    } else if (p1?.packageName) {
      return -1;
    } else if (p2?.packageName) {
      return 1;
    }
    return 0;
  };
}
