// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/system';
import { ReactElement, useEffect, useMemo, useState } from 'react';

import { List } from '../../Components/List/List';
import { ResizableBox } from '../../Components/ResizableBox/ResizableBox';
import { usePrevious } from '../../util/use-previous';
import { NodeIdPredicateForTree, NodesForTree, TreeNodeStyle } from './types';
import { getTreeNodeProps } from './utils/get-tree-node-props';
import {
  VirtualizedTreeNode,
  VirtualizedTreeNodeData,
} from './VirtualizedTreeNode';

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
  const previousSelectedNodeId = usePrevious(props.selectedNodeId);
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

  const [indexToScrollTo, setIndexToScrollTo] = useState(0);
  const newIndex = useMemo(
    () =>
      treeNodeProps.findIndex((datum) => datum.nodeId === props.selectedNodeId),
    [props.selectedNodeId, treeNodeProps],
  );
  const previousIndex = usePrevious(newIndex, 0);

  useEffect(() => {
    if (
      (previousSelectedNodeId !== props.selectedNodeId || previousIndex < 0) &&
      newIndex > 0
    ) {
      setIndexToScrollTo(newIndex);
    }
  }, [
    newIndex,
    previousIndex,
    previousSelectedNodeId,
    props.expandedIds,
    props.selectedNodeId,
  ]);

  return props.nodes ? (
    <ResizableBox
      aria-label={'resource browser'}
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
