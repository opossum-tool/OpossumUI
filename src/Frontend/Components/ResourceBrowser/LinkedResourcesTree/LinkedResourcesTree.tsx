// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';
import { remove } from 'lodash';
import { useCallback, useEffect, useState } from 'react';

import { OpossumColors } from '../../../shared-styles';
import { navigateToSelectedPathOrOpenUnsavedPopup } from '../../../state/actions/popup-actions/popup-actions';
import { getInitialExpandedIds } from '../../../state/helpers/resources-helpers';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import { getSelectedResourceId } from '../../../state/selectors/resource-selectors';
import { VirtualizedTree } from '../../VirtualizedTree/VirtualizedTree';
import { LinkedResourcesTreeNode } from './LinkedResourcesTreeNode/LinkedResourcesTreeNode';

interface Props {
  disableHighlightSelected?: boolean;
  readOnly?: boolean;
  resourceIds: Array<string>;
  sx?: SxProps;
}

export function LinkedResourcesTree({
  readOnly,
  disableHighlightSelected,
  resourceIds,
  sx,
}: Props) {
  const dispatch = useAppDispatch();
  const selectedResourceId = useAppSelector(getSelectedResourceId);

  const [expandedIds, setExpandedIds] = useState<Array<string>>([]);

  useEffect(() => {
    setExpandedIds(getInitialExpandedIds(resourceIds, selectedResourceId));
  }, [resourceIds, selectedResourceId]);

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
      setExpandedIds(newExpandedNodeIds);
    },
    [expandedIds],
  );

  const handleSelect = useCallback(
    (nodeId: string) =>
      dispatch(navigateToSelectedPathOrOpenUnsavedPopup(nodeId)),
    [dispatch],
  );

  return (
    <VirtualizedTree
      expandedIds={expandedIds}
      onSelect={handleSelect}
      onToggle={handleToggle}
      sx={{
        ...(readOnly && {
          background: OpossumColors.lightGrey,
          border: `1px solid ${OpossumColors.lightGrey}`,
          boxSizing: 'border-box',
        }),
        ...sx,
      }}
      resourceIds={resourceIds}
      selectedNodeId={disableHighlightSelected ? '' : selectedResourceId}
      readOnly={readOnly}
      TreeNodeLabel={LinkedResourcesTreeNode}
      testId={'linked-resources-tree'}
    />
  );
}
