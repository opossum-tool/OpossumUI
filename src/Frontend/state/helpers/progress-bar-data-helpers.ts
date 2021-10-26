// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  Resources,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import { PathPredicate, ProgressBarData } from '../../types/types';
import { canHaveChildren } from '../../util/can-have-children';

export function getUpdatedProgressBarData(
  resources: Resources,
  manualAttributions: Attributions,
  resourcesToManualAttributions: ResourcesToAttributions,
  resourcesToExternalAttributions: ResourcesToAttributions,
  resolvedExternalAttributions: Set<string>,
  isAttributionBreakpoint: PathPredicate,
  isFileWithChildren: PathPredicate
): ProgressBarData {
  const progressBarData: ProgressBarData = {
    fileCount: 0,
    filesWithManualAttributionCount: 0,
    filesWithOnlyPreSelectedAttributionCount: 0,
    filesWithOnlyExternalAttributionCount: 0,
    filesWithSignalOnly: [],
  };

  updateProgressBarDataForResources(
    progressBarData,
    { '': resources },
    manualAttributions,
    resourcesToManualAttributions,
    filterResourcesToAttributions(
      resourcesToExternalAttributions,
      resolvedExternalAttributions
    ),
    isAttributionBreakpoint,
    isFileWithChildren
  );

  return progressBarData;
}

function filterResourcesToAttributions(
  resourcesToAttributions: ResourcesToAttributions,
  attributionIdsToRemove: Set<string>
): ResourcesToAttributions {
  return Object.fromEntries(
    Object.entries(resourcesToAttributions)
      .map(([resourceId, attributionIds]) => {
        return [
          resourceId,
          attributionIds.filter(
            (attributionId) => !attributionIdsToRemove.has(attributionId)
          ),
        ];
      })
      .filter(([, filteredAttributionIds]) => filteredAttributionIds.length)
  );
}

export function updateProgressBarDataForResources(
  progressBarData: ProgressBarData,
  resources: Resources,
  manualAttributions: Attributions,
  resourcesToManualAttributions: ResourcesToAttributions,
  resourcesToExternalAttributions: ResourcesToAttributions,
  isAttributionBreakpoint: PathPredicate,
  isFileWithChildren: PathPredicate,
  parentPath = '',
  hasParentManualAttribution = false,
  hasParentOnlyPreselectedAttribution = false,
  hasParentExternalAttribution = false
): void {
  for (const resourceName of Object.keys(resources)) {
    const resource: Resources | 1 = resources[resourceName];
    const path = `${parentPath}${resourceName}${
      canHaveChildren(resource) ? '/' : ''
    }`;

    const hasOnlyPreselectedAttributionFromParent = Boolean(
      hasParentOnlyPreselectedAttribution &&
        !resourcesToManualAttributions[path]
    );

    const hasOnlyPreselectedAttribution = Boolean(
      hasOnlyPreselectedAttributionFromParent ||
        resourceHasOnlyPreSelectedAttributions(
          path,
          resourcesToManualAttributions,
          manualAttributions
        )
    );

    const hasManualAttribution: boolean =
      hasParentManualAttribution ||
      Boolean(resourcesToManualAttributions[path]);
    const hasExternalAttribution = Boolean(
      resourcesToExternalAttributions[path]
    );
    const resourceCanHaveChildren = canHaveChildren(resource);

    if (!resourceCanHaveChildren || isFileWithChildren(path)) {
      progressBarData.fileCount++;
      if (hasOnlyPreselectedAttribution) {
        progressBarData.filesWithOnlyPreSelectedAttributionCount++;
      } else if (hasManualAttribution) {
        progressBarData.filesWithManualAttributionCount++;
      } else if (hasExternalAttribution) {
        progressBarData.filesWithOnlyExternalAttributionCount++;
        progressBarData.filesWithSignalOnly.push(path);
      } else if (hasParentExternalAttribution) {
        progressBarData.filesWithOnlyExternalAttributionCount++;
      }
    }

    if (resourceCanHaveChildren) {
      const isBreakpoint = isAttributionBreakpoint(path);
      updateProgressBarDataForResources(
        progressBarData,
        resource as Resources,
        manualAttributions,
        resourcesToManualAttributions,
        resourcesToExternalAttributions,
        isAttributionBreakpoint,
        isFileWithChildren,
        path,
        hasManualAttribution && !isBreakpoint,
        hasOnlyPreselectedAttribution && !isBreakpoint,
        hasExternalAttribution && !isBreakpoint
      );
    }
  }
}

export function resourceHasOnlyPreSelectedAttributions(
  path: string,
  resourcesToManualAttributions: ResourcesToAttributions,
  manualAttributions: Attributions
): boolean {
  return (
    resourcesToManualAttributions[path] &&
    resourcesToManualAttributions[path].every(
      (attributionId: string): boolean => {
        return Boolean(
          manualAttributions[attributionId] &&
            manualAttributions[attributionId].preSelected
        );
      }
    )
  );
}
