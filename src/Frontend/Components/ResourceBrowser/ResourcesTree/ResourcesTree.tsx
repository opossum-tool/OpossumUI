// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';
import { remove } from 'lodash';
import { useCallback, useEffect } from 'react';

import { ResourceTreeNodeData } from '../../../../ElectronBackend/api/resourceTree';
import {
  EMPTY_DISPLAY_PACKAGE_INFO,
  ROOT_PATH,
} from '../../../shared-constants';
import {
  changeSelectedAttributionOrOpenUnsavedPopup,
  setSelectedResourceIdOrOpenUnsavedPopup,
} from '../../../state/actions/popup-actions/popup-actions';
import {
  setExpandedIds,
  setSelectedResourceId,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import {
  getExpandedIds,
  getSelectedResourceId,
} from '../../../state/selectors/resource-selectors';
import { backend } from '../../../util/backendClient';
import { VirtualizedTree } from '../../VirtualizedTree/VirtualizedTree';
import { ResourcesTreeNode } from './ResourcesTreeNode/ResourcesTreeNode';

interface Props {
  resources: Array<ResourceTreeNodeData>;
  sx?: SxProps;
}

export const ResourcesTree = ({ resources, sx }: Props) => {
  const dispatch = useAppDispatch();
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const expandedIds = useAppSelector(getExpandedIds);

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
    async (nodeId: string) => {
      dispatch(setSelectedResourceIdOrOpenUnsavedPopup(nodeId));
      const attributionToAutoselect =
        await backend.getManualAttributionOnResourceOrAncestor.query({
          resourcePath: nodeId,
        });
      dispatch(
        changeSelectedAttributionOrOpenUnsavedPopup(
          attributionToAutoselect || EMPTY_DISPLAY_PACKAGE_INFO,
        ),
      );
    },
    [dispatch],
  );

  return (
    <VirtualizedTree
      onSelect={handleSelect}
      onToggle={handleToggle}
      resources={resources}
      selectedNodeId={selectedResourceId}
      TreeNodeLabel={ResourcesTreeNode}
      sx={sx}
      testId={'resources-tree'}
    />
  );
};
