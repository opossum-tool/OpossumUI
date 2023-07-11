// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  Attributions,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../shared/shared-types';
import { getAttributedChildren } from './get-attributed-children';
import { AttributionIdWithCount } from '../types/types';

export type PanelAttributionData = Pick<
  AttributionData,
  'attributions' | 'resourcesToAttributions' | 'resourcesWithAttributedChildren'
>;

export function getExternalAttributionIdsWithCount(
  attributionIds: Array<string>,
): Array<AttributionIdWithCount> {
  return attributionIds.map((attributionId) => ({
    attributionId,
  }));
}

export function getContainedExternalPackages(
  selectedResourceId: string,
  resourcesWithAttributedChildren: Readonly<ResourcesWithAttributedChildren>,
  externalAttributions: Readonly<Attributions>,
  resourcesToExternalAttributions: Readonly<ResourcesToAttributions>,
  resolvedExternalAttributions: Readonly<Set<string>>,
): Array<AttributionIdWithCount> {
  const externalAttributedChildren = getAttributedChildren(
    resourcesWithAttributedChildren,
    selectedResourceId,
  );

  return computeAggregatedAttributionsFromChildren(
    externalAttributions,
    resourcesToExternalAttributions,
    externalAttributedChildren,
    resolvedExternalAttributions,
  );
}

export function getContainedManualPackages(
  selectedResourceId: string,
  manualData: Readonly<PanelAttributionData>,
): Array<AttributionIdWithCount> {
  const manualAttributedChildren = getAttributedChildren(
    manualData.resourcesWithAttributedChildren,
    selectedResourceId,
  );

  return computeAggregatedAttributionsFromChildren(
    manualData.attributions,
    manualData.resourcesToAttributions,
    manualAttributedChildren,
  );
}

// exported for testing
export function computeAggregatedAttributionsFromChildren(
  attributions: Readonly<Attributions>,
  resourcesToAttributions: Readonly<ResourcesToAttributions>,
  attributedChildren: Readonly<Set<string>>,
  resolvedExternalAttributions?: Readonly<Set<string>>,
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

  return Object.keys(attributionCount).map((attributionId: string) => ({
    attributionId,
    count: attributionCount[attributionId],
  }));
}
