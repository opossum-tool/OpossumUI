// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';
import { remove } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ROOT_PATH } from '../../../shared-constants';
import { OpossumColors } from '../../../shared-styles';
import { navigateToSelectedPathOrOpenUnsavedPopup } from '../../../state/actions/popup-actions/popup-actions';
import {
  getInitialExpandedIds,
  getResourcesFromPaths,
} from '../../../state/helpers/resources-helpers';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import {
  getAttributionBreakpoints,
  getFilesWithChildren,
  getSelectedResourceId,
} from '../../../state/selectors/resource-selectors';
import { VirtualizedTree } from '../../VirtualizedTree/VirtualizedTree';
import { GeneralTreeItemLabel } from './GeneralTreeItemLabel/GeneralTreeItemLabel';

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
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const selectedResourceId = useAppSelector(getSelectedResourceId);

  const nodes = useMemo(
    () => getResourcesFromPaths(resourceIds),
    [resourceIds],
  );
  const [expandedIds, setExpandedIds] = useState<Array<string>>([]);

  useEffect(() => {
    setExpandedIds(getInitialExpandedIds(resourceIds));
  }, [resourceIds]);

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

  return (
    <VirtualizedTree
      expandedIds={expandedIds}
      onSelect={(_, nodeId) =>
        dispatch(navigateToSelectedPathOrOpenUnsavedPopup(nodeId))
      }
      onToggle={handleToggle}
      sx={{
        ...(readOnly && {
          background: OpossumColors.lightGrey,
          border: `1px solid ${OpossumColors.lightGrey}`,
          boxSizing: 'border-box',
        }),
        ...sx,
      }}
      nodes={nodes}
      selectedNodeId={disableHighlightSelected ? '' : selectedResourceId}
      readOnly={readOnly}
      getTreeNodeLabel={(resourceName, resource, nodeId) => (
        <GeneralTreeItemLabel
          labelText={resourceName === '' ? ROOT_PATH : resourceName}
          canHaveChildren={resource !== 1}
          isAttributionBreakpoint={attributionBreakpoints.has(nodeId)}
          showFolderIcon={resource !== 1 && !filesWithChildren.has(nodeId)}
        />
      )}
    />
  );
}
