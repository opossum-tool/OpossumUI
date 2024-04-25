// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  Criticality,
  Resources,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../../../../shared/shared-types';
import { ROOT_PATH } from '../../../../shared-constants';
import { getClosestParentAttributions } from '../../../../util/get-closest-parent-attributions';

export function getCriticality(
  nodeId: string,
  resourcesToExternalAttributions: ResourcesToAttributions,
  externalAttributions: Attributions,
  resolvedExternalAttributions: Set<string>,
): Criticality | undefined {
  if (
    hasUnresolvedExternalAttribution(
      nodeId,
      resourcesToExternalAttributions,
      resolvedExternalAttributions,
    )
  ) {
    const attributionsForResource = resourcesToExternalAttributions[nodeId];
    for (const attributionId of attributionsForResource) {
      if (
        !resolvedExternalAttributions.has(attributionId) &&
        externalAttributions[attributionId].criticality === Criticality.High
      ) {
        return Criticality.High;
      }
    }

    for (const attributionId of attributionsForResource) {
      if (
        !resolvedExternalAttributions.has(attributionId) &&
        externalAttributions[attributionId].criticality === Criticality.Medium
      ) {
        return Criticality.Medium;
      }
    }
  }
  return undefined;
}

function isRootResource(resourceName: string): boolean {
  return resourceName === '';
}

export function getDisplayName(resourceName: string): string {
  return isRootResource(resourceName) ? ROOT_PATH : resourceName;
}

export function hasManualAttribution(
  nodeId: string,
  resourcesToManualAttributions: ResourcesToAttributions,
): boolean {
  return nodeId in resourcesToManualAttributions;
}

export function hasExternalAttribution(
  nodeId: string,
  resourcesToExternalAttributions: ResourcesToAttributions,
): boolean {
  return nodeId in resourcesToExternalAttributions;
}

export function hasUnresolvedExternalAttribution(
  nodeId: string,
  resourcesToExternalAttributions: ResourcesToAttributions,
  resolvedExternalAttributions: Set<string>,
): boolean {
  return (
    nodeId in resourcesToExternalAttributions &&
    resourcesToExternalAttributions[nodeId].some(
      (attribution) => !resolvedExternalAttributions.has(attribution),
    )
  );
}

export function containsExternalAttribution(
  nodeId: string,
  resourcesWithExternalAttributedChildren: ResourcesWithAttributedChildren,
): boolean {
  const nodeIndex =
    resourcesWithExternalAttributedChildren.pathsToIndices[nodeId];

  return (
    nodeIndex !== undefined &&
    resourcesWithExternalAttributedChildren.attributedChildren[nodeIndex] !==
      undefined
  );
}

export function containsManualAttribution(
  nodeId: string,
  resourcesWithManualAttributedChildren: ResourcesWithAttributedChildren,
): boolean {
  return resourcesWithManualAttributedChildren.paths.includes(nodeId);
}

export function hasParentWithManualAttributionAndNoOwnAttribution(
  nodeId: string,
  manualAttributions: Attributions,
  resourcesToManualAttributions: ResourcesToAttributions,
  attributionBreakpoints: Set<string>,
): boolean {
  return (
    getClosestParentAttributions(
      nodeId,
      manualAttributions,
      resourcesToManualAttributions,
      attributionBreakpoints,
    ) !== null && !hasManualAttribution(nodeId, resourcesToManualAttributions)
  );
}

export function containsResourcesWithOnlyExternalAttribution(
  nodeId: string,
  resourcesToManualAttributions: ResourcesToAttributions,
  resourcesToExternalAttributions: ResourcesToAttributions,
  resource: Resources | 1,
): boolean {
  if (hasManualAttribution(nodeId, resourcesToManualAttributions)) {
    return false;
  }
  if (hasExternalAttribution(nodeId, resourcesToExternalAttributions)) {
    return true;
  }
  if (resource === 1) {
    return false;
  }
  return Object.keys(resource).some((node) =>
    containsResourcesWithOnlyExternalAttribution(
      resource[node] === 1 ? nodeId + node : `${nodeId + node}/`,
      resourcesToManualAttributions,
      resourcesToExternalAttributions,
      resource[node],
    ),
  );
}
