// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  Attributions,
  Criticality,
  Resources,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../../shared/shared-types';
import { PathPredicate } from '../../types/types';
import React, { ReactElement } from 'react';
import { StyledTreeItemLabel } from '../StyledTreeItemLabel/StyledTreeItemLabel';
import { getClosestParentAttributions } from '../../util/get-closest-parent-attributions';

export function getTreeItemLabel(
  resourceName: string,
  resource: Resources | 1,
  nodeId: string,
  resourcesToManualAttributions: ResourcesToAttributions,
  resourcesToExternalAttributions: ResourcesToAttributions,
  manualAttributions: Attributions,
  resourcesWithExternalAttributedChildren: ResourcesWithAttributedChildren,
  resourcesWithManualAttributedChildren: ResourcesWithAttributedChildren,
  resolvedExternalAttributions: Set<string>,
  isAttributionBreakpoint: PathPredicate,
  isFileWithChildren: PathPredicate,
  externalData: AttributionData
): ReactElement {
  const canHaveChildren = resource !== 1;

  return (
    <StyledTreeItemLabel
      labelText={getDisplayName(resourceName)}
      canHaveChildren={canHaveChildren}
      hasManualAttribution={hasManualAttribution(
        nodeId,
        resourcesToManualAttributions
      )}
      hasExternalAttribution={hasExternalAttribution(
        nodeId,
        resourcesToExternalAttributions
      )}
      hasUnresolvedExternalAttribution={hasUnresolvedExternalAttribution(
        nodeId,
        resourcesToExternalAttributions,
        resolvedExternalAttributions
      )}
      hasParentWithManualAttribution={hasParentWithManualAttributionAndNoOwnAttribution(
        nodeId,
        manualAttributions,
        resourcesToManualAttributions,
        isAttributionBreakpoint
      )}
      containsExternalAttribution={containsExternalAttribution(
        nodeId,
        resourcesWithExternalAttributedChildren
      )}
      containsManualAttribution={containsManualAttribution(
        nodeId,
        resourcesWithManualAttributedChildren
      )}
      criticality={getCriticality(
        nodeId,
        resourcesToExternalAttributions,
        externalData.attributions
      )}
      isAttributionBreakpoint={isAttributionBreakpoint(nodeId)}
      showFolderIcon={canHaveChildren && !isFileWithChildren(nodeId)}
      containsResourcesWithOnlyExternalAttribution={
        canHaveChildren &&
        containsResourcesWithOnlyExternalAttribution(
          nodeId,
          resourcesToManualAttributions,
          resourcesToExternalAttributions,
          resource
        )
      }
    />
  );
}

export function getCriticality(
  nodeId: string,
  resourcesToExternalAttributions: ResourcesToAttributions,
  externalAttributions: Attributions
): Criticality | undefined {
  if (hasExternalAttribution(nodeId, resourcesToExternalAttributions)) {
    const attributionsForResource = resourcesToExternalAttributions[nodeId];

    for (const attribution of attributionsForResource) {
      if (externalAttributions[attribution].criticality === Criticality.High) {
        return Criticality.High;
      }
    }

    for (const attribution of attributionsForResource) {
      if (
        externalAttributions[attribution].criticality === Criticality.Medium
      ) {
        return Criticality.Medium;
      }
    }

    return undefined;
  }
}

function isRootResource(resourceName: string): boolean {
  return resourceName === '';
}

function getDisplayName(resourceName: string): string {
  return isRootResource(resourceName) ? '/' : resourceName;
}

function hasManualAttribution(
  nodeId: string,
  resourcesToManualAttributions: ResourcesToAttributions
): boolean {
  return nodeId in resourcesToManualAttributions;
}

function hasExternalAttribution(
  nodeId: string,
  resourcesToExternalAttributions: ResourcesToAttributions
): boolean {
  return nodeId in resourcesToExternalAttributions;
}

function hasUnresolvedExternalAttribution(
  nodeId: string,
  resourcesToExternalAttributions: ResourcesToAttributions,
  resolvedExternalAttributions: Set<string>
): boolean {
  return (
    nodeId in resourcesToExternalAttributions &&
    resourcesToExternalAttributions[nodeId].filter(
      (attribution) => !resolvedExternalAttributions.has(attribution)
    ).length > 0
  );
}

function containsExternalAttribution(
  nodeId: string,
  resourcesWithExternalAttributedChildren: ResourcesWithAttributedChildren
): boolean {
  return (
    resourcesWithExternalAttributedChildren &&
    nodeId in resourcesWithExternalAttributedChildren
  );
}

function containsManualAttribution(
  nodeId: string,
  resourcesWithManualAttributedChildren: ResourcesWithAttributedChildren
): boolean {
  return (
    resourcesWithManualAttributedChildren &&
    nodeId in resourcesWithManualAttributedChildren
  );
}

function hasParentWithManualAttribution(
  nodeId: string,
  manualAttributions: Attributions,
  resourcesToManualAttributions: ResourcesToAttributions,
  isAttributionBreakpoint: PathPredicate
): boolean {
  return (
    getClosestParentAttributions(
      nodeId,
      manualAttributions,
      resourcesToManualAttributions,
      isAttributionBreakpoint
    ) !== null
  );
}

function hasParentWithManualAttributionAndNoOwnAttribution(
  nodeId: string,
  manualAttributions: Attributions,
  resourcesToManualAttributions: ResourcesToAttributions,
  isAttributionBreakpoint: PathPredicate
): boolean {
  return (
    hasParentWithManualAttribution(
      nodeId,
      manualAttributions,
      resourcesToManualAttributions,
      isAttributionBreakpoint
    ) && !hasManualAttribution(nodeId, resourcesToManualAttributions)
  );
}

function containsResourcesWithOnlyExternalAttribution(
  nodeId: string,
  resourcesToManualAttributions: ResourcesToAttributions,
  resourcesToExternalAttributions: ResourcesToAttributions,
  resource: Resources | 1
): boolean {
  if (hasManualAttribution(nodeId, resourcesToManualAttributions)) return false;
  if (hasExternalAttribution(nodeId, resourcesToExternalAttributions))
    return true;
  if (resource === 1) return false;
  return Object.keys(resource).some((node) =>
    containsResourcesWithOnlyExternalAttribution(
      resource[node] === 1 ? nodeId + node : nodeId + node + '/',
      resourcesToManualAttributions,
      resourcesToExternalAttributions,
      resource[node]
    )
  );
}
