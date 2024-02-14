// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement } from 'react';

import { VirtualizedTreeNodeProps } from './VirtualizedTreeNode/VirtualizedTreeNode';

export function getTreeNodeProps(
  nodes: NodesForTree,
  parentPath: string,
  expandedNodes: Array<string>,
  selected: string,
  filesWithChildren: Set<string>,
  onSelect: (event: React.ChangeEvent<unknown>, nodeId: string) => void,
  onToggle: (nodeIdsToExpand: Array<string>) => void,
  getTreeNodeLabel: (
    nodeName: string,
    node: NodesForTree | 1,
    nodeId: string,
  ) => ReactElement,
  breakpoints?: Set<string>,
  readonly: boolean = false,
): Array<VirtualizedTreeNodeProps> {
  const sortedNodeNames: Array<string> = Object.keys(nodes).sort(
    getSortFunction(nodes, filesWithChildren, parentPath),
  );

  let treeNodes: Array<VirtualizedTreeNodeProps> = [];

  for (const nodeName of sortedNodeNames) {
    const node = nodes[nodeName];
    const isExpandable =
      canNodeHaveChildren(node) && Object.keys(node).length !== 0;
    const nodeId = getNodeId(nodeName, parentPath, canNodeHaveChildren(node));
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
      onClick: readonly
        ? undefined
        : isExpandable
          ? onExpandableNodeClick
          : onSimpleNodeClick,
      onToggle,
      node,
      nodeName,
      selected,
      breakpoints,
    });

    if (isExpandedNode) {
      treeNodes = treeNodes.concat(
        getTreeNodeProps(
          node as NodesForTree,
          nodeId,
          expandedNodes,
          selected,
          filesWithChildren,
          onSelect,
          onToggle,
          getTreeNodeLabel,
          breakpoints,
          readonly,
        ),
      );
    }
  }

  return treeNodes;
}

export function getNodeIdsToExpand(
  nodeId: string,
  node: NodesForTree | 1,
): Array<string> {
  const nodeIdsToExpand: Array<string> = [nodeId];
  addNodeIdsToExpand(nodeIdsToExpand, node);
  return nodeIdsToExpand;
}

function addNodeIdsToExpand(
  nodeIdsToExpand: Array<string>,
  node: NodesForTree | 1,
): void {
  const containedNodes = Object.keys(node);
  if (node !== 1 && containsExactlyOneFolder(node, containedNodes)) {
    nodeIdsToExpand.push(
      getNodeIdOfFirstContainedNode(containedNodes, nodeIdsToExpand, node),
    );
    addNodeIdsToExpand(nodeIdsToExpand, node[containedNodes[0]]);
  }
}

function containsExactlyOneFolder(
  node: NodesForTree,
  containedNodes: Array<string>,
): boolean {
  return (
    containedNodes.length === 1 && canNodeHaveChildren(node[containedNodes[0]])
  );
}

function getNodeIdOfFirstContainedNode(
  containedNodes: Array<string>,
  nodeIdsToExpand: Array<string>,
  node: NodesForTree,
): string {
  const latestNodeIdToExpand = nodeIdsToExpand[nodeIdsToExpand.length - 1];
  return getNodeId(
    containedNodes[0],
    latestNodeIdToExpand,
    canNodeHaveChildren(node[containedNodes[0]]),
  );
}

function getNodeId(nodeName: string, path: string, isFolder: boolean): string {
  return path + (isFolder ? `${nodeName}/` : nodeName);
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

export function isSelected(nodeId: string, selectedId: string): boolean {
  return nodeId === selectedId;
}

function getSortFunction(
  nodes: NodesForTree,
  filesWithChildren: Set<string>,
  path: string,
) {
  return (left: string, right: string): number => {
    const leftNode = nodes[left];
    const rightNode = nodes[right];
    const leftIsFolderOrFileWithChildren = canNodeHaveChildren(leftNode);
    const rightIsFolderOrFileWithChildren = canNodeHaveChildren(rightNode);
    const leftNodeId = getNodeId(left, path, leftIsFolderOrFileWithChildren);
    const rightNodeId = getNodeId(right, path, rightIsFolderOrFileWithChildren);

    const leftNodeIsFolder =
      leftIsFolderOrFileWithChildren && !filesWithChildren.has(leftNodeId);
    const rightNodeIsFolder =
      rightIsFolderOrFileWithChildren && !filesWithChildren.has(rightNodeId);

    if (leftNodeIsFolder && !rightNodeIsFolder) {
      return -1;
    } else if (!leftNodeIsFolder && rightNodeIsFolder) {
      return 1;
    }
    return left.toLowerCase() < right.toLowerCase() ? -1 : 1;
  };
}

function canNodeHaveChildren(node: NodesForTree | 1): node is NodesForTree {
  return node !== 1;
}

function isIdOfNodeWithChildren(nodeId: string): boolean {
  return nodeId.slice(-1) === '/';
}

export interface NodesForTree {
  [nodeName: string]: NodesForTree | 1;
}
