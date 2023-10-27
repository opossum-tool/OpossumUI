// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from 'react';
import { List } from '../../Components/List/List';
import { ResizableBox } from '../../Components/ResizableBox/ResizableBox';
import {
  VirtualizedTreeNode,
  VirtualizedTreeNodeData,
} from './VirtualizedTreeNode';
import { NodeIdPredicateForTree, NodesForTree, TreeNodeStyle } from './types';
import { getTreeNodeProps } from './utils/get-tree-node-props';
import { SxProps } from '@mui/system';

interface VirtualizedTreeProps {
  nodes: NodesForTree;
  getTreeNodeLabel: (
    nodeName: string,
    node: NodesForTree | 1,
    nodeId: string,
  ) => ReactElement;
  expandedIds: Array<string>;
  selectedNodeId: string;
  isFakeNonExpandableNode: NodeIdPredicateForTree;
  onSelect: (event: React.ChangeEvent<unknown>, nodeId: string) => void;
  onToggle: (nodeIdsToExpand: Array<string>) => void;
  ariaLabel?: string;
  cardHeight: number;
  width?: number | string;
  expandedNodeIcon?: ReactElement;
  nonExpandedNodeIcon?: ReactElement;
  sx?: SxProps;
  treeNodeStyle?: TreeNodeStyle;
  breakpoints?: Set<string>;
  locatorIcon?: ReactElement;
  locatedResourceIcon?: ReactElement;
  locatedResources?: Set<string>;
  resourcesWithLocatedChildren?: Set<string>;
  resizable?: boolean;
}

export function VirtualizedTree(
  props: VirtualizedTreeProps,
): ReactElement | null {
  const treeNodeProps: Array<VirtualizedTreeNodeData> = getTreeNodeProps(
    props.nodes,
    '',
    props.expandedIds,
    props.selectedNodeId,
    props.isFakeNonExpandableNode,
    props.onSelect,
    props.onToggle,
    props.getTreeNodeLabel,
    props.locatedResources,
    props.resourcesWithLocatedChildren,
    props.breakpoints,
  );

  const indexToScrollTo = treeNodeProps.findIndex(
    (itemData) => itemData.nodeId === props.selectedNodeId,
  );

  return props.nodes ? (
    <ResizableBox
      aria-label={props.ariaLabel}
      sx={props.sx}
      defaultSize={{ width: props.width ?? 'auto', height: '100%' }}
      enable={props.resizable === true ? undefined : false}
    >
      {props.locatorIcon}
      <List
        length={treeNodeProps.length}
        cardHeight={props.cardHeight}
        getListItem={(index: number): ReactElement => (
          <VirtualizedTreeNode
            {...treeNodeProps[index]}
            expandedNodeIcon={props.expandedNodeIcon}
            nonExpandedNodeIcon={props.nonExpandedNodeIcon}
            locatedResourceIcon={props.locatedResourceIcon}
            treeNodeStyle={props.treeNodeStyle}
          />
        )}
        indexToScrollTo={indexToScrollTo}
        fullHeight
      />
    </ResizableBox>
  ) : null;
}
