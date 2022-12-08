// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  Resources,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import {
  PathPredicate,
  ProgressBarData,
  ProgressBarWorkerArgs,
} from '../../types/types';
import { canResourceHaveChildren } from '../../util/can-resource-have-children';
import { getAttributionBreakpointCheck } from '../../util/is-attribution-breakpoint';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';

export function filterResourcesToAttributions(
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

function updateProgressBarDataForResources(
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
      canResourceHaveChildren(resource) ? '/' : ''
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
    const hasNonInheritedExternalAttributions = Boolean(
      resourcesToExternalAttributions[path]
    );
    const resourceCanHaveChildren = canResourceHaveChildren(resource);

    if (!resourceCanHaveChildren || isFileWithChildren(path)) {
      progressBarData.fileCount++;
      if (hasOnlyPreselectedAttribution) {
        progressBarData.filesWithOnlyPreSelectedAttributionCount++;
      } else if (hasManualAttribution) {
        progressBarData.filesWithManualAttributionCount++;
      } else if (hasNonInheritedExternalAttributions) {
        progressBarData.filesWithOnlyExternalAttributionCount++;
        progressBarData.resourcesWithNonInheritedExternalAttributionOnly.push(
          path
        );
      } else if (hasParentExternalAttribution) {
        progressBarData.filesWithOnlyExternalAttributionCount++;
      }
    }

    if (resourceCanHaveChildren) {
      if (
        !isFileWithChildren(path) &&
        !hasManualAttribution &&
        hasNonInheritedExternalAttributions
      ) {
        progressBarData.resourcesWithNonInheritedExternalAttributionOnly.push(
          path
        );
      }

      const isBreakpoint = isAttributionBreakpoint(path);
      updateProgressBarDataForResources(
        progressBarData,
        resource,
        manualAttributions,
        resourcesToManualAttributions,
        resourcesToExternalAttributions,
        isAttributionBreakpoint,
        isFileWithChildren,
        path,
        hasManualAttribution && !isBreakpoint,
        hasOnlyPreselectedAttribution && !isBreakpoint,
        hasNonInheritedExternalAttributions && !isBreakpoint
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

export function getUpdatedProgressBarData(
  args: ProgressBarWorkerArgs
): ProgressBarData {
  const isAttributionBreakpoint = getAttributionBreakpointCheck(
    args.attributionBreakpoints
  );
  const isFileWithChildren = getFileWithChildrenCheck(args.filesWithChildren);
  const progressBarData = getEmptyProgressBarData();

  let resources = args.resources || {};
  if (args.resourceId) {
    const parentAndCurrentResources = args.resourceId.slice(1, -1).split('/');
    resources = {
      '': getCurrentSubTree(parentAndCurrentResources, resources),
    };
  }

  updateProgressBarDataForResources(
    progressBarData,
    resources,
    args.manualAttributions,
    args.resourcesToManualAttributions,
    filterResourcesToAttributions(
      args.resourcesToExternalAttributions,
      args.resolvedExternalAttributions
    ),
    isAttributionBreakpoint,
    isFileWithChildren
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
  };
}

function getCurrentSubTree(
  parentAndCurrentResources: string[],
  resources: Resources
): Resources {
  const resource = parentAndCurrentResources.shift();
  if (resource) {
    return {
      [resource]: getCurrentSubTree(
        parentAndCurrentResources,
        resources[resource] as Resources
      ),
    };
  } else {
    return resources;
  }
}
