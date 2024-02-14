// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';
import { remove } from 'lodash';
import { useEffect, useMemo } from 'react';

import { ROOT_PATH } from '../../../shared-constants';
import { setSelectedResourceIdOrOpenUnsavedPopup } from '../../../state/actions/popup-actions/popup-actions';
import {
  setExpandedIds,
  setSelectedResourceId,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { getResourcesFromPaths } from '../../../state/helpers/resources-helpers';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import {
  getAttributionBreakpoints,
  getExpandedIds,
  getExternalData,
  getFilesWithChildren,
  getManualAttributions,
  getResolvedExternalAttributions,
  getResourcesToExternalAttributions,
  getResourcesToManualAttributions,
  getResourcesWithExternalAttributedChildren,
  getResourcesWithManualAttributedChildren,
  getSelectedResourceId,
} from '../../../state/selectors/resource-selectors';
import { useFilteredAttributions } from '../../../state/variables/use-filtered-data';
import { VirtualizedTree } from '../../VirtualizedTree/VirtualizedTree';
import { ResourcesTreeNodeLabel } from './ResourcesTreeNodeLabel/ResourcesTreeNodeLabel';

interface Props {
  resourceIds: Array<string>;
  sx?: SxProps;
}

export const ResourcesTree = ({ resourceIds, sx }: Props) => {
  const dispatch = useAppDispatch();
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const expandedIds = useAppSelector(getExpandedIds);
  const manualAttributions = useAppSelector(getManualAttributions);
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
  const externalData = useAppSelector(getExternalData);

  const [_, setFilteredAttributions] = useFilteredAttributions();

  const nodes = useMemo(
    () => getResourcesFromPaths(resourceIds),
    [resourceIds],
  );

  useEffect(() => {
    if (!selectedResourceId) {
      dispatch(setSelectedResourceId(ROOT_PATH));
    }
  }, [dispatch, selectedResourceId]);

  const handleToggle = (nodeIdsToExpand: Array<string>) => {
    let newExpandedNodeIds = [...expandedIds];
    if (expandedIds.includes(nodeIdsToExpand[0])) {
      remove(newExpandedNodeIds, (nodeId) =>
        nodeId.startsWith(nodeIdsToExpand[0]),
      );
    } else {
      newExpandedNodeIds = newExpandedNodeIds.concat(nodeIdsToExpand);
    }
    dispatch(setExpandedIds(newExpandedNodeIds));
  };

  return (
    <VirtualizedTree
      expandedIds={expandedIds}
      onSelect={(_, nodeId) => {
        setFilteredAttributions((prev) => ({
          ...prev,
          selectFirstAttribution: true,
        }));
        dispatch(setSelectedResourceIdOrOpenUnsavedPopup(nodeId));
      }}
      onToggle={handleToggle}
      nodes={nodes}
      selectedNodeId={selectedResourceId}
      getTreeNodeLabel={(resourceName, resource, nodeId) => (
        <ResourcesTreeNodeLabel
          resourceName={resourceName}
          resource={resource}
          nodeId={nodeId}
          resourcesToManualAttributions={resourcesToManualAttributions}
          resourcesToExternalAttributions={resourcesToExternalAttributions}
          manualAttributions={manualAttributions}
          resourcesWithExternalAttributedChildren={
            resourcesWithExternalAttributedChildren
          }
          resourcesWithManualAttributedChildren={
            resourcesWithManualAttributedChildren
          }
          resolvedExternalAttributions={resolvedExternalAttributions}
          attributionBreakpoints={attributionBreakpoints}
          filesWithChildren={filesWithChildren}
          externalData={externalData}
        />
      )}
      breakpoints={attributionBreakpoints}
      sx={sx}
    />
  );
};
