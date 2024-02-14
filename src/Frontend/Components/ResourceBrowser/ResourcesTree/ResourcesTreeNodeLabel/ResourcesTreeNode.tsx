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
import { useAppSelector } from '../../../../state/hooks';
import {
  getAttributionBreakpoints,
  getExternalAttributions,
  getFilesWithChildren,
  getManualAttributions,
  getResolvedExternalAttributions,
  getResourcesToExternalAttributions,
  getResourcesToManualAttributions,
  getResourcesWithExternalAttributedChildren,
  getResourcesWithManualAttributedChildren,
} from '../../../../state/selectors/resource-selectors';
import { getClosestParentAttributions } from '../../../../util/get-closest-parent-attributions';
import { TreeNode } from '../../../VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode';
import { ResourceBrowserTreeItemLabel } from '../ResourceBrowserTreeItemLabel/ResourceBrowserTreeItemLabel';

export function ResourcesTreeNode({ node, nodeId, nodeName }: TreeNode) {
  const manualAttributions = useAppSelector(getManualAttributions);
  const externalAttributions = useAppSelector(getExternalAttributions);
  const resourcesToManualAttributions = useAppSelector(
    getResourcesToManualAttributions,
  );
  const resourcesWithManualAttributedChildren = useAppSelector(
    getResourcesWithManualAttributedChildren,
  );
  const resourcesToExternalAttributions = useAppSelector(
    getResourcesToExternalAttributions,
  );
  const resourcesWithExternalAttributedChildren = useAppSelector(
    getResourcesWithExternalAttributedChildren,
  );
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions,
  );
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const filesWithChildren = useAppSelector(getFilesWithChildren);

  const canHaveChildren = node !== 1;

  return (
    <ResourceBrowserTreeItemLabel
      labelText={getDisplayName(nodeName)}
      canHaveChildren={canHaveChildren}
      hasManualAttribution={hasManualAttribution(
        nodeId,
        resourcesToManualAttributions,
      )}
      hasExternalAttribution={hasExternalAttribution(
        nodeId,
        resourcesToExternalAttributions,
      )}
      hasUnresolvedExternalAttribution={hasUnresolvedExternalAttribution(
        nodeId,
        resourcesToExternalAttributions,
        resolvedExternalAttributions,
      )}
      hasParentWithManualAttribution={hasParentWithManualAttributionAndNoOwnAttribution(
        nodeId,
        manualAttributions,
        resourcesToManualAttributions,
        attributionBreakpoints,
      )}
      containsExternalAttribution={containsExternalAttribution(
        nodeId,
        resourcesWithExternalAttributedChildren,
      )}
      containsManualAttribution={containsManualAttribution(
        nodeId,
        resourcesWithManualAttributedChildren,
      )}
      criticality={getCriticality(
        nodeId,
        resourcesToExternalAttributions,
        externalAttributions,
      )}
      isAttributionBreakpoint={attributionBreakpoints.has(nodeId)}
      showFolderIcon={canHaveChildren && !filesWithChildren.has(nodeId)}
      containsResourcesWithOnlyExternalAttribution={
        canHaveChildren &&
        containsResourcesWithOnlyExternalAttribution(
          nodeId,
          resourcesToManualAttributions,
          resourcesToExternalAttributions,
          node,
        )
      }
    />
  );
}

export function getCriticality(
  nodeId: string,
  resourcesToExternalAttributions: ResourcesToAttributions,
  externalAttributions: Attributions,
): Criticality | undefined {
  if (hasExternalAttribution(nodeId, resourcesToExternalAttributions)) {
    const attributionsForResource = resourcesToExternalAttributions[nodeId];
    for (const attributionId of attributionsForResource) {
      if (
        externalAttributions[attributionId].criticality === Criticality.High
      ) {
        return Criticality.High;
      }
    }

    for (const attributionId of attributionsForResource) {
      if (
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

function getDisplayName(resourceName: string): string {
  return isRootResource(resourceName) ? ROOT_PATH : resourceName;
}

function hasManualAttribution(
  nodeId: string,
  resourcesToManualAttributions: ResourcesToAttributions,
): boolean {
  return nodeId in resourcesToManualAttributions;
}

function hasExternalAttribution(
  nodeId: string,
  resourcesToExternalAttributions: ResourcesToAttributions,
): boolean {
  return nodeId in resourcesToExternalAttributions;
}

function hasUnresolvedExternalAttribution(
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

function containsExternalAttribution(
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
  return (
    resourcesWithManualAttributedChildren &&
    resourcesWithManualAttributedChildren.paths.includes(nodeId)
  );
}

function hasParentWithManualAttributionAndNoOwnAttribution(
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

function containsResourcesWithOnlyExternalAttribution(
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
