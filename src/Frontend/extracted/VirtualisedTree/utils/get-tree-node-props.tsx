// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { getParents } from '../../../state/helpers/get-parents';
import { NodeIdPredicateForTree, NodesForTree } from '../types';
import { VirtualizedTreeNodeData } from '../VirtualizedTreeNode';

export function getTreeNodeProps(
  nodes: NodesForTree,
  parentPath: string,
  expandedNodes: Array<string>,
  selected: string,
  isFileWithChildren: NodeIdPredicateForTree,
  onSelect: (event: React.ChangeEvent<unknown>, nodeId: string) => void,
  onToggle: (nodeIdsToExpand: Array<string>) => void,
  getTreeNodeLabel: (
    nodeName: string,
    node: NodesForTree | 1,
    nodeId: string
  ) => ReactElement,
  cardHeight: number,
  breakpoints: Set<string>
): Array<VirtualizedTreeNodeData> {
  const sortedNodeNames: Array<string> = Object.keys(nodes).sort(
    getSortFunction(nodes, isFileWithChildren, parentPath)
  );

  let treeNodes: Array<VirtualizedTreeNodeData> = [];

  for (const nodeName of sortedNodeNames) {
    const node = nodes[nodeName];
    const nodeHeight = cardHeight - 1;
    const isExpandable = canNodeHaveChildren(node);
    const nodeId = getNodeId(nodeName, parentPath, isExpandable);
    const isExpandedNode = isExpanded(nodeId, expandedNodes);

    const nodeIdsToExpand: Array<string> = getNodeIdsToExpand(nodeId, node);

    function onExpandableNodeClick(event: React.ChangeEvent<unknown>): void {
      if (!isExpandedNode) {
        onToggle(nodeIdsToExpand);
      }
      onSelect(event, nodeId);
    }

    function onSimpleNodeClick(event: React.ChangeEvent<unknown>): void {
      onSelect(event, nodeId);
    }

    treeNodes.push({
      getTreeNodeLabel,
      isExpandable,
      isExpandedNode,
      nodeId,
      nodeIdsToExpand,
      onClick: isExpandable ? onExpandableNodeClick : onSimpleNodeClick,
      onToggle,
      node,
      nodeName,
      selected,
      nodeHeight,
      breakpoints,
    });

    if (isExpandedNode) {
      treeNodes = treeNodes.concat(
        getTreeNodeProps(
          node as NodesForTree,
          nodeId,
          expandedNodes,
          selected,
          isFileWithChildren,
          onSelect,
          onToggle,
          getTreeNodeLabel,
          nodeHeight,
          breakpoints
        )
      );
    }
  }

  return treeNodes;
}

export function getNodeIdsToExpand(
  nodeId: string,
  node: NodesForTree | 1
): Array<string> {
  const nodeIdsToExpand: Array<string> = [nodeId];
  addNodeIdsToExpand(nodeIdsToExpand, node);
  return nodeIdsToExpand;
}

function addNodeIdsToExpand(
  nodeIdsToExpand: Array<string>,
  node: NodesForTree | 1
): void {
  const containedNodes = Object.keys(node);
  if (node !== 1 && containsExactlyOneFolder(node, containedNodes)) {
    nodeIdsToExpand.push(
      getNodeIdOfFirstContainedNode(containedNodes, nodeIdsToExpand, node)
    );
    addNodeIdsToExpand(nodeIdsToExpand, node[containedNodes[0]]);
  }
}

function containsExactlyOneFolder(
  node: NodesForTree,
  containedNodes: Array<string>
): boolean {
  return (
    containedNodes.length === 1 && canNodeHaveChildren(node[containedNodes[0]])
  );
}

function getNodeIdOfFirstContainedNode(
  containedNodes: Array<string>,
  nodeIdsToExpand: Array<string>,
  node: NodesForTree
): string {
  const latestNodeIdToExpand = nodeIdsToExpand[nodeIdsToExpand.length - 1];
  return getNodeId(
    containedNodes[0],
    latestNodeIdToExpand,
    canNodeHaveChildren(node[containedNodes[0]])
  );
}

function getNodeId(nodeName: string, path: string, isFolder: boolean): string {
  return path + (isFolder ? nodeName + '/' : nodeName);
}

function isExpanded(nodeId: string, expandedNodes: Array<string>): boolean {
  if (!isIdOfNodeWithChildren(nodeId)) {
    return false;
  }

  for (const expandedNodeId of expandedNodes) {
    if (expandedNodeId === nodeId) {
      return true;
    }
  }

  return false;
}

export function isSelected(nodeId: string, selected: string): boolean {
  return nodeId === selected;
}

export function isChildOfSelected(nodeId: string, selected: string): boolean {
  return (
    nodeId.startsWith(selected) &&
    !isSelected(nodeId, selected) &&
    selected.slice(-1) === '/'
  );
}

export function isBreakpointOrChildOfBreakpoint(
  nodeId: string,
  selected: string,
  breakpoints: Set<string>
): boolean {
  const relativePathToNodeFromSelected = nodeId.replace(selected, '');
  const parents = getParents(relativePathToNodeFromSelected);
  const isChildOfBreakpoint =
    parents.filter((item) => breakpoints.has(selected + item)).length > 0
      ? true
      : false;

  return breakpoints.has(nodeId) || isChildOfBreakpoint;
}

function getSortFunction(
  nodes: NodesForTree,
  isFakeNonExpandableNode: NodeIdPredicateForTree,
  path: string
) {
  return (left: string, right: string): number => {
    const leftNode = nodes[left];
    const rightNode = nodes[right];
    const leftIsFolderOrFileWithChildren = canNodeHaveChildren(leftNode);
    const rightIsFolderOrFileWithChildren = canNodeHaveChildren(rightNode);
    const leftNodeId = getNodeId(left, path, leftIsFolderOrFileWithChildren);
    const rightNodeId = getNodeId(right, path, rightIsFolderOrFileWithChildren);

    const leftNodeIsFolder =
      leftIsFolderOrFileWithChildren && !isFakeNonExpandableNode(leftNodeId);
    const rightNodeIsFolder =
      rightIsFolderOrFileWithChildren && !isFakeNonExpandableNode(rightNodeId);

    if (leftNodeIsFolder && !rightNodeIsFolder) {
      return -1;
    } else if (!leftNodeIsFolder && rightNodeIsFolder) {
      return 1;
    }
    return left.toLowerCase().localeCompare(right.toLowerCase());
  };
}

function canNodeHaveChildren(node: NodesForTree | 1): node is NodesForTree {
  return node !== 1;
}

function isIdOfNodeWithChildren(nodeId: string): boolean {
  return nodeId.slice(-1) === '/';
}
