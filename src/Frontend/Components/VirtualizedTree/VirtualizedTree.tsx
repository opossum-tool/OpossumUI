// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';

import { Resources } from '../../../shared/shared-types';
import { TREE_ROOT_FOLDER_LABEL } from '../../shared-styles';
import { useAppSelector } from '../../state/hooks';
import { getFilesWithChildren } from '../../state/selectors/resource-selectors';
import { List } from '../List/List';
import { getTreeNodeProps } from './VirtualizedTree.util';
import { VirtualizedTreeNode } from './VirtualizedTreeNode/VirtualizedTreeNode';

interface VirtualizedTreeProps {
  nodes: Resources;
  getTreeNodeLabel: (
    nodeName: string,
    node: Resources | 1,
    nodeId: string,
  ) => React.ReactElement;
  expandedIds: Array<string>;
  selectedNodeId?: string;
  onSelect: (event: React.ChangeEvent<unknown>, nodeId: string) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  width?: number | string;
  sx?: SxProps;
  breakpoints?: Set<string>;
  readOnly?: boolean;
}

export function VirtualizedTree(props: VirtualizedTreeProps) {
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const treeNodeProps = getTreeNodeProps(
    { [TREE_ROOT_FOLDER_LABEL]: props.nodes },
    '',
    props.expandedIds,
    props.selectedNodeId || '',
    filesWithChildren,
    props.onSelect,
    props.onToggle,
    props.getTreeNodeLabel,
    props.breakpoints,
    props.readOnly,
  );

  return (
    <List
      data={Object.keys(props.nodes).length ? treeNodeProps : []}
      renderItemContent={(props) => <VirtualizedTreeNode {...props} />}
      selected={treeNodeProps.find(
        ({ nodeId }) => props.selectedNodeId === nodeId,
      )}
      sx={{
        height: '100%',
        // allow tree node selected indicator to overflow the width of the list
        '& [data-viewport-type]': {
          width: 'unset !important',
          minWidth: '100%',
        },
        ...props.sx,
      }}
    />
  );
}
