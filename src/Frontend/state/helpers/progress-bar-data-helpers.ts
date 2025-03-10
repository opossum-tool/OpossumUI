// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  Classifications,
  Criticality,
  Resources,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import { TREE_ROOT_FOLDER_LABEL } from '../../shared-styles';
import { ClassificationStatistics, ProgressBarData } from '../../types/types';
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

function addPathToClassificationStatistics(
  progressBarData: ProgressBarData,
  highestClassification: number,
  path: string,
) {
  if (progressBarData.classificationStatistics[highestClassification]) {
    progressBarData.classificationStatistics[
      highestClassification
    ].correspondingFiles.push(path);
  } else {
    progressBarData.classificationStatistics[highestClassification] = {
      description: highestClassification.toFixed(0),
      correspondingFiles: [path],
    };
  }
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
  highestClassification: number | undefined = undefined,
): void {
  const highestClassificationAtThisFolderPath = highestClassification;
  for (const resourceName of Object.keys(resources)) {
    highestClassification = highestClassificationAtThisFolderPath;
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

    const currentResourcesHighestClassification =
      getHighestClassificationOfExternalAttributions(
        path,
        resourcesToExternalAttributions,
        externalAttributions,
      );

    if (currentResourcesHighestClassification !== undefined) {
      highestClassification = currentResourcesHighestClassification;
    }

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
        if (highestClassification !== undefined) {
          addPathToClassificationStatistics(
            progressBarData,
            highestClassification,
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
        if (highestClassification) {
          addPathToClassificationStatistics(
            progressBarData,
            highestClassification,
            path,
          );
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
        highestClassification,
      );
    }
  }
}

export function getHighestCriticalityOfExternalAttributions(
  path: string,
  resourcesToExternalAttributions: ResourcesToAttributions,
  externalAttributions: Attributions,
): Criticality {
  let highestCriticality = Criticality.None;

  const externalAttributionsOfCurrentResource =
    resourcesToExternalAttributions[path];

  if (externalAttributionsOfCurrentResource) {
    for (const attributionId of externalAttributionsOfCurrentResource) {
      const criticality =
        externalAttributions[attributionId]?.criticality ?? Criticality.None;
      highestCriticality = Math.max(highestCriticality, criticality);
    }
  }

  return highestCriticality;
}

export function getHighestClassificationOfExternalAttributions(
  path: string,
  resourcesToExternalAttributions: ResourcesToAttributions,
  externalAttributions: Attributions,
): number | undefined {
  let highestClassification = undefined;
  const externalAttributionsOfCurrentResource =
    resourcesToExternalAttributions[path];
  if (externalAttributionsOfCurrentResource) {
    for (const attributionId of externalAttributionsOfCurrentResource) {
      const classification = externalAttributions[attributionId]
        ? externalAttributions[attributionId].classification
        : 0;
      if (
        classification !== undefined &&
        (highestClassification === undefined ||
          classification > highestClassification)
      ) {
        highestClassification = classification;
      }
    }
  }
  return highestClassification;
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
  classifications: Classifications;
}): ProgressBarData {
  const progressBarData = getEmptyProgressBarData(args.classifications);

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

export function getEmptyProgressBarData(
  classifications: Classifications,
): ProgressBarData {
  const classificationStatistics: ClassificationStatistics = {};
  if (classifications) {
    Object.entries(classifications).map(
      ([classificationNumber, description]) => {
        classificationStatistics[classificationNumber as unknown as number] = {
          description,
          correspondingFiles: [],
        };
      },
    );
  }

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
    classificationStatistics,
  };
}
