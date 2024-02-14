// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';
import { remove } from 'lodash';
import { useCallback, useEffect } from 'react';

import { ROOT_PATH } from '../../../shared-constants';
import { setSelectedResourceIdOrOpenUnsavedPopup } from '../../../state/actions/popup-actions/popup-actions';
import {
  setExpandedIds,
  setSelectedResourceId,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import {
  getExpandedIds,
  getSelectedResourceId,
} from '../../../state/selectors/resource-selectors';
import { useFilteredAttributions } from '../../../state/variables/use-filtered-data';
import { VirtualizedTree } from '../../VirtualizedTree/VirtualizedTree';
import { ResourcesTreeNode } from './ResourcesTreeNodeLabel/ResourcesTreeNode';

interface Props {
  resourceIds: Array<string>;
  sx?: SxProps;
}

export const ResourcesTree = ({ resourceIds, sx }: Props) => {
  const dispatch = useAppDispatch();
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const expandedIds = useAppSelector(getExpandedIds);

  const [_, setFilteredAttributions] = useFilteredAttributions();

  useEffect(() => {
    if (!selectedResourceId) {
      dispatch(setSelectedResourceId(ROOT_PATH));
    }
  }, [dispatch, selectedResourceId]);

  const handleToggle = useCallback(
    (nodeIdsToExpand: Array<string>) => {
      let newExpandedNodeIds = [...expandedIds];
      if (expandedIds.includes(nodeIdsToExpand[0])) {
        remove(newExpandedNodeIds, (nodeId) =>
          nodeId.startsWith(nodeIdsToExpand[0]),
        );
      } else {
        newExpandedNodeIds = newExpandedNodeIds.concat(nodeIdsToExpand);
      }
      dispatch(setExpandedIds(newExpandedNodeIds));
    },
    [dispatch, expandedIds],
  );

  const handleSelect = useCallback(
    (nodeId: string) => {
      setFilteredAttributions((prev) => ({
        ...prev,
        selectFirstAttribution: true,
      }));
      dispatch(setSelectedResourceIdOrOpenUnsavedPopup(nodeId));
    },
    [dispatch, setFilteredAttributions],
  );

  return (
    <VirtualizedTree
      expandedIds={expandedIds}
      onSelect={handleSelect}
      onToggle={handleToggle}
      resourceIds={resourceIds}
      selectedNodeId={selectedResourceId}
      TreeNodeLabel={ResourcesTreeNode}
      sx={sx}
      testId={'resources-tree'}
    />
  );
};
