// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useAppSelector } from '../../../../state/hooks';
import {
  getAttributionBreakpoints,
  getClassifications,
  getExternalAttributions,
  getFilesWithChildren,
  getManualAttributions,
  getResolvedExternalAttributions,
  getResourcesToExternalAttributions,
  getResourcesToManualAttributions,
  getResourcesWithExternalAttributedChildren,
  getResourcesWithManualAttributedChildren,
} from '../../../../state/selectors/resource-selectors';
import { useShowClassifications } from '../../../../state/variables/use-show-classifications';
import { TreeNode } from '../../../VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode';
import {
  containsExternalAttribution,
  containsManualAttribution,
  containsResourcesWithOnlyExternalAttribution,
  getClassification,
  getCriticality,
  getDisplayName,
  hasExternalAttribution,
  hasManualAttribution,
  hasParentWithManualAttributionAndNoOwnAttribution,
  hasUnresolvedExternalAttribution,
} from './ResourcesTreeNode.util';
import { ResourcesTreeNodeLabel } from './ResourcesTreeNodeLabel/ResourcesTreeNodeLabel';

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
  const classification_mapping = useAppSelector(getClassifications);
  const [showClassifications] = useShowClassifications();

  return (
    <ResourcesTreeNodeLabel
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
        resolvedExternalAttributions,
      )}
      classification={getClassification(
        nodeId,
        resourcesToExternalAttributions,
        externalAttributions,
        resolvedExternalAttributions,
      )}
      classificationsConfig={classification_mapping}
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
      showClassifications={showClassifications}
    />
  );
}
