// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackagePanelTitle } from '../../enums/enums';
import {
  AttributionData,
  AttributionIdWithCount,
  Attributions,
  PackageInfo,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import { getAttributedChildren } from '../../util/get-attributed-children';
import { isIdOfResourceWithChildren } from '../../util/can-have-children';

export interface PanelData {
  title: PackagePanelTitle;
  attributionIdsWithCount: Array<AttributionIdWithCount>;
  attributions: Attributions;
}

export function getPanelData(
  selectedResourceId: string,
  manualData: AttributionData,
  externalData: AttributionData,
  resolvedExternalAttributions: Set<string>
): Array<PanelData> {
  let panelData: Array<PanelData> = [
    {
      title: PackagePanelTitle.ExternalPackages,
      attributionIdsWithCount: getExternalAttributionIdsWithCount(
        externalData.resourcesToAttributions[selectedResourceId] || []
      ),
      attributions: externalData.attributions,
    },
  ];

  if (isIdOfResourceWithChildren(selectedResourceId)) {
    panelData = panelData.concat([
      {
        title: PackagePanelTitle.ContainedExternalPackages,
        attributionIdsWithCount: getContainedExternalPackages(
          selectedResourceId,
          externalData,
          resolvedExternalAttributions
        ),
        attributions: externalData.attributions,
      },
      {
        title: PackagePanelTitle.ContainedManualPackages,
        attributionIdsWithCount: getContainedManualPackages(
          selectedResourceId,
          manualData
        ),
        attributions: manualData.attributions,
      },
    ]);
  }

  return panelData;
}

function getExternalAttributionIdsWithCount(
  attributionIds: Array<string>
): Array<AttributionIdWithCount> {
  return attributionIds.map((attributionId) => ({
    attributionId,
  }));
}

function getContainedExternalPackages(
  selectedResourceId: string,
  externalData: AttributionData,
  resolvedExternalAttributions: Set<string>
): Array<AttributionIdWithCount> {
  const externalAttributedChildren = getAttributedChildren(
    externalData.resourcesWithAttributedChildren,
    selectedResourceId
  );

  return computeAggregatedAttributionsFromChildren(
    externalData.attributions,
    externalData.resourcesToAttributions,
    externalAttributedChildren,
    resolvedExternalAttributions
  );
}

function getContainedManualPackages(
  selectedResourceId: string,
  manualData: AttributionData
): Array<AttributionIdWithCount> {
  const manualAttributedChildren = getAttributedChildren(
    manualData.resourcesWithAttributedChildren,
    selectedResourceId
  );

  return computeAggregatedAttributionsFromChildren(
    manualData.attributions,
    manualData.resourcesToAttributions,
    manualAttributedChildren
  );
}

// exported for testing
export function computeAggregatedAttributionsFromChildren(
  attributions: Attributions,
  resourcesToAttributions: ResourcesToAttributions,
  attributedChildren: Set<string>,
  resolvedExternalAttributions = new Set<string>()
): Array<AttributionIdWithCount> {
  const attributionCount: { [attributionId: string]: number } = {};
  attributedChildren.forEach((child: string) => {
    resourcesToAttributions[child].forEach((attributionId: string) => {
      if (!resolvedExternalAttributions.has(attributionId)) {
        attributionCount[attributionId] =
          (attributionCount[attributionId] || 0) + 1;
      }
    });
  });

  return Object.keys(attributionCount)
    .map((attributionId: string) => ({
      attributionId,
      childrenWithAttributionCount: attributionCount[attributionId],
    }))
    .sort(sortByCountAndPackageName(attributions));
}

export function sortByCountAndPackageName(attributions: Attributions) {
  return function (
    a1: AttributionIdWithCount,
    a2: AttributionIdWithCount
  ): number {
    if (
      a1.childrenWithAttributionCount &&
      a2.childrenWithAttributionCount &&
      a1.childrenWithAttributionCount !== a2.childrenWithAttributionCount
    ) {
      return a2.childrenWithAttributionCount - a1.childrenWithAttributionCount;
    }

    const p1: PackageInfo = attributions[a1.attributionId];
    const p2: PackageInfo = attributions[a2.attributionId];
    if (p1?.packageName && p2?.packageName) {
      return p1.packageName.localeCompare(p2.packageName, undefined, {
        sensitivity: 'base',
      });
    } else if (p1?.packageName) {
      return -1;
    } else if (p2?.packageName) {
      return 1;
    }
    return 0;
  };
}
