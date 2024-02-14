// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  Criticality,
  Resources,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import { TREE_ROOT_FOLDER_LABEL } from '../../shared-styles';
import { ProgressBarData } from '../../types/types';
import { canResourceHaveChildren } from '../../util/can-resource-have-children';

export function filterResourcesToAttributions(
  resourcesToAttributions: ResourcesToAttributions,
  attributionIdsToRemove: Set<string>,
): ResourcesToAttributions {
  return Object.fromEntries(
    Object.entries(resourcesToAttributions)
      .map(([resourceId, attributionIds]) => {
        return [
          resourceId,
          attributionIds.filter(
            (attributionId) => !attributionIdsToRemove.has(attributionId),
          ),
        ];
      })
      .filter(([, filteredAttributionIds]) => filteredAttributionIds.length),
  );
}

function updateProgressBarDataForResources(
  progressBarData: ProgressBarData,
  resources: Resources,
  manualAttributions: Attributions,
  externalAttributions: Attributions,
  resourcesToManualAttributions: ResourcesToAttributions,
  resourcesToExternalAttributions: ResourcesToAttributions,
  attributionBreakpoints: Set<string>,
  filesWithChildren: Set<string>,
  parentPath = '',
  hasParentManualAttribution = false,
  hasParentOnlyPreselectedAttribution = false,
  hasParentExternalAttribution = false,
): void {
  for (const resourceName of Object.keys(resources)) {
    const resource = resources[resourceName] as Resources | 1 | undefined;
    const path = `${parentPath}${resourceName}${
      canResourceHaveChildren(resource) ? '/' : ''
    }`;

    const hasOnlyPreselectedAttributionFromParent = Boolean(
      hasParentOnlyPreselectedAttribution &&
        !resourcesToManualAttributions[path],
    );

    const hasOnlyPreselectedAttribution = Boolean(
      hasOnlyPreselectedAttributionFromParent ||
        resourceHasOnlyPreSelectedAttributions(
          path,
          resourcesToManualAttributions,
          manualAttributions,
        ),
    );

    const hasManualAttribution: boolean =
      hasParentManualAttribution ||
      Boolean(resourcesToManualAttributions[path]);
    const hasNonInheritedExternalAttributions = Boolean(
      resourcesToExternalAttributions[path],
    );
    const resourceCanHaveChildren = canResourceHaveChildren(resource);

    const highestCriticality = getHighestCriticalityOfExternalAttributions(
      path,
      resourcesToExternalAttributions,
      externalAttributions,
    );

    if (!resourceCanHaveChildren || filesWithChildren.has(path)) {
      progressBarData.fileCount++;
      if (hasOnlyPreselectedAttribution) {
        progressBarData.filesWithOnlyPreSelectedAttributionCount++;
      } else if (hasManualAttribution) {
        progressBarData.filesWithManualAttributionCount++;
      } else if (hasNonInheritedExternalAttributions) {
        progressBarData.filesWithOnlyExternalAttributionCount++;
        progressBarData.resourcesWithNonInheritedExternalAttributionOnly.push(
          path,
        );
        if (highestCriticality === Criticality.High) {
          progressBarData.filesWithHighlyCriticalExternalAttributionsCount++;
          progressBarData.resourcesWithHighlyCriticalExternalAttributions.push(
            path,
          );
        } else if (highestCriticality === Criticality.Medium) {
          progressBarData.filesWithMediumCriticalExternalAttributionsCount++;
          progressBarData.resourcesWithMediumCriticalExternalAttributions.push(
            path,
          );
        }
      } else if (hasParentExternalAttribution) {
        progressBarData.filesWithOnlyExternalAttributionCount++;
        if (highestCriticality === Criticality.High) {
          progressBarData.filesWithHighlyCriticalExternalAttributionsCount++;
        } else if (highestCriticality === Criticality.Medium) {
          progressBarData.filesWithMediumCriticalExternalAttributionsCount++;
        }
      }
    }

    if (resourceCanHaveChildren) {
      if (
        !filesWithChildren.has(path) &&
        !hasManualAttribution &&
        hasNonInheritedExternalAttributions
      ) {
        progressBarData.resourcesWithNonInheritedExternalAttributionOnly.push(
          path,
        );
        if (highestCriticality === Criticality.High) {
          progressBarData.resourcesWithHighlyCriticalExternalAttributions.push(
            path,
          );
        } else if (highestCriticality === Criticality.Medium) {
          progressBarData.resourcesWithMediumCriticalExternalAttributions.push(
            path,
          );
        }
      }

      const isBreakpoint = attributionBreakpoints.has(path);
      updateProgressBarDataForResources(
        progressBarData,
        resource,
        manualAttributions,
        externalAttributions,
        resourcesToManualAttributions,
        resourcesToExternalAttributions,
        attributionBreakpoints,
        filesWithChildren,
        path,
        hasManualAttribution && !isBreakpoint,
        hasOnlyPreselectedAttribution && !isBreakpoint,
        (hasNonInheritedExternalAttributions || hasParentExternalAttribution) &&
          !isBreakpoint,
      );
    }
  }
}

export function getHighestCriticalityOfExternalAttributions(
  path: string,
  resourcesToExternalAttributions: ResourcesToAttributions,
  externalAttributions: Attributions,
): Criticality | null {
  let hasMediumCriticality = false;
  const externalAttributionsOfCurrentResource =
    resourcesToExternalAttributions[path];
  if (externalAttributionsOfCurrentResource) {
    for (const attributionId of externalAttributionsOfCurrentResource) {
      const criticality = externalAttributions[attributionId]
        ? externalAttributions[attributionId].criticality
        : null;
      if (criticality === Criticality.High) {
        return Criticality.High;
      } else if (criticality === Criticality.Medium) {
        hasMediumCriticality = true;
      }
    }
  }
  return hasMediumCriticality ? Criticality.Medium : null;
}

export function resourceHasOnlyPreSelectedAttributions(
  path: string,
  resourcesToManualAttributions: ResourcesToAttributions,
  manualAttributions: Attributions,
): boolean {
  return (
    resourcesToManualAttributions[path] &&
    resourcesToManualAttributions[path].every(
      (attributionId: string): boolean => {
        return Boolean(
          manualAttributions[attributionId] &&
            manualAttributions[attributionId].preSelected,
        );
      },
    )
  );
}

export function getUpdatedProgressBarData(args: {
  resources: Resources;
  manualAttributions: Attributions;
  externalAttributions: Attributions;
  resourcesToManualAttributions: ResourcesToAttributions;
  resourcesToExternalAttributions: ResourcesToAttributions;
  resolvedExternalAttributions: Set<string>;
  attributionBreakpoints: Set<string>;
  filesWithChildren: Set<string>;
}): ProgressBarData {
  const progressBarData = getEmptyProgressBarData();

  updateProgressBarDataForResources(
    progressBarData,
    { [TREE_ROOT_FOLDER_LABEL]: args.resources },
    args.manualAttributions,
    args.externalAttributions,
    args.resourcesToManualAttributions,
    filterResourcesToAttributions(
      args.resourcesToExternalAttributions,
      args.resolvedExternalAttributions,
    ),
    args.attributionBreakpoints,
    args.filesWithChildren,
  );

  return progressBarData;
}

export function getEmptyProgressBarData(): ProgressBarData {
  return {
    fileCount: 0,
    filesWithManualAttributionCount: 0,
    filesWithOnlyPreSelectedAttributionCount: 0,
    filesWithOnlyExternalAttributionCount: 0,
    resourcesWithNonInheritedExternalAttributionOnly: [],
    filesWithHighlyCriticalExternalAttributionsCount: 0,
    filesWithMediumCriticalExternalAttributionsCount: 0,
    resourcesWithHighlyCriticalExternalAttributions: [],
    resourcesWithMediumCriticalExternalAttributions: [],
  };
}
