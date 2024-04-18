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
import { ProgressBarWithButtonsData } from '../../types/types';
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
  progressBarData: ProgressBarWithButtonsData,
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
      progressBarData.count.files++;
      if (hasOnlyPreselectedAttribution) {
        progressBarData.count.filesWithOnlyPreSelectedAttribution++;
      } else if (hasManualAttribution) {
        progressBarData.count.filesWithManualAttribution++;
      } else if (hasNonInheritedExternalAttributions) {
        progressBarData.count.filesWithOnlyExternalAttribution++;
        progressBarData.resources.withNonInheritedExternalAttributionOnly.push(
          path,
        );
        if (highestCriticality === Criticality.High) {
          progressBarData.count.filesWithHighlyCriticalExternalAttributions++;
          progressBarData.resources.withHighlyCriticalExternalAttributions.push(
            path,
          );
        } else if (highestCriticality === Criticality.Medium) {
          progressBarData.count.filesWithMediumCriticalExternalAttributions++;
          progressBarData.resources.withMediumCriticalExternalAttributions.push(
            path,
          );
        }
      } else if (hasParentExternalAttribution) {
        progressBarData.count.filesWithOnlyExternalAttribution++;
        if (highestCriticality === Criticality.High) {
          progressBarData.count.filesWithHighlyCriticalExternalAttributions++;
        } else if (highestCriticality === Criticality.Medium) {
          progressBarData.count.filesWithMediumCriticalExternalAttributions++;
        }
      }
    }

    if (resourceCanHaveChildren) {
      if (
        !filesWithChildren.has(path) &&
        !hasManualAttribution &&
        hasNonInheritedExternalAttributions
      ) {
        progressBarData.resources.withNonInheritedExternalAttributionOnly.push(
          path,
        );
        if (highestCriticality === Criticality.High) {
          progressBarData.resources.withHighlyCriticalExternalAttributions.push(
            path,
          );
        } else if (highestCriticality === Criticality.Medium) {
          progressBarData.resources.withMediumCriticalExternalAttributions.push(
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
  return resourcesToManualAttributions[path]?.every(
    (attributionId: string): boolean => {
      return Boolean(manualAttributions[attributionId]?.preSelected);
    },
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
}): ProgressBarWithButtonsData {
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

export function getEmptyProgressBarData(): ProgressBarWithButtonsData {
  return {
    count: {
      files: 0,
      filesWithManualAttribution: 0,
      filesWithOnlyPreSelectedAttribution: 0,
      filesWithOnlyExternalAttribution: 0,
      filesWithHighlyCriticalExternalAttributions: 0,
      filesWithMediumCriticalExternalAttributions: 0,
    },
    resources: {
      withNonInheritedExternalAttributionOnly: [],
      withHighlyCriticalExternalAttributions: [],
      withMediumCriticalExternalAttributions: [],
    },
  };
}
