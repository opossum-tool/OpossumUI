// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiListItemIcon from '@mui/material/ListItemIcon';
import MuiMenu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import type { SxProps } from '@mui/system';
import { remove } from 'lodash-es';
import { type MouseEvent, useCallback, useEffect, useState } from 'react';

import type { ResourceTreeNodeData } from '../../../../ElectronBackend/api/resourceTree';
import { text } from '../../../../shared/text';
import {
  EMPTY_DISPLAY_PACKAGE_INFO,
  ROOT_PATH,
} from '../../../shared-constants';
import {
  changeSelectedAttributionOrOpenUnsavedPopup,
  setSelectedResourceIdOrOpenUnsavedPopup,
  showSplitDialogOrOpenUnsavedPopup,
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
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    resource: ResourceTreeNodeData;
  } | null>(null);

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

  const handleContextMenu = useCallback(
    (event: MouseEvent<HTMLElement>, resource: ResourceTreeNodeData) => {
      event.preventDefault();
      setContextMenu({
        mouseX: event.clientX,
        mouseY: event.clientY,
        resource,
      });
    },
    [],
  );

  const handleSplit = useCallback(() => {
    if (!contextMenu) {
      return;
    }
    setContextMenu(null);
    dispatch(
      showSplitDialogOrOpenUnsavedPopup(
        contextMenu.resource.id.replace(/\/$/, ''),
      ),
    );
  }, [contextMenu, dispatch]);

  return (
    <>
      <VirtualizedTree
        onSelect={handleSelect}
        onToggle={handleToggle}
        resources={resources}
        selectedNodeId={selectedResourceId}
        TreeNodeLabel={ResourcesTreeNode}
        onContextMenu={handleContextMenu}
        contextMenuNodeId={contextMenu?.resource.id}
        sx={sx}
        testId={'resources-tree'}
      />
      <MuiMenu
        anchorReference={'anchorPosition'}
        anchorPosition={
          contextMenu
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        onClose={() => setContextMenu(null)}
        open={contextMenu !== null}
      >
        <MuiMenuItem
          disabled={contextMenu?.resource.id === ROOT_PATH}
          onClick={handleSplit}
        >
          <MuiListItemIcon>
            <img alt={''} src={'assets/icons/follow-up-black.png'} />
          </MuiListItemIcon>
          {text.resourceBrowser.splitHere}
        </MuiMenuItem>
      </MuiMenu>
    </>
  );
};
