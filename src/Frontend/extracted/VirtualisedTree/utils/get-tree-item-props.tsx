// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { ItemsForTree, PathPredicateForTree } from '../types';
import { VirtualizedTreeItemData } from '../VirtualizedTreeItem';

export function getTreeItemProps(
  items: ItemsForTree,
  parentPath: string,
  expandedNodes: Array<string>,
  selected: string,
  isFileWithChildren: PathPredicateForTree,
  onSelect: (event: React.ChangeEvent<unknown>, nodeId: string) => void,
  onToggle: (nodeIdsToExpand: Array<string>) => void,
  getTreeItemLabel: (
    itemName: string,
    item: ItemsForTree | 1,
    nodeId: string
  ) => ReactElement
): Array<VirtualizedTreeItemData> {
  const sortedItemNames: Array<string> = Object.keys(items).sort(
    getSortFunction(items, isFileWithChildren, parentPath)
  );

  let treeItems: Array<VirtualizedTreeItemData> = [];

  for (const itemName of sortedItemNames) {
    const item = items[itemName];
    const isExpandable = canItemHaveChildren(item);
    const nodeId = getNodeId(itemName, parentPath, isExpandable);
    const isExpandedNode = isExpanded(nodeId, expandedNodes);

    const nodeIdsToExpand: Array<string> = getNodeIdsToExpand(nodeId, item);

    function onExpandableNodeClick(event: React.ChangeEvent<unknown>): void {
      if (!isExpandedNode) {
        onToggle(nodeIdsToExpand);
      }
      onSelect(event, nodeId);
    }

    function onSimpleNodeClick(event: React.ChangeEvent<unknown>): void {
      onSelect(event, nodeId);
    }

    treeItems.push({
      getTreeItemLabel,
      isExpandable,
      isExpandedNode,
      nodeId,
      nodeIdsToExpand,
      onClick: isExpandable ? onExpandableNodeClick : onSimpleNodeClick,
      onToggle,
      item,
      itemName,
      selected,
    });

    if (isExpandedNode) {
      treeItems = treeItems.concat(
        getTreeItemProps(
          item as ItemsForTree,
          nodeId,
          expandedNodes,
          selected,
          isFileWithChildren,
          onSelect,
          onToggle,
          getTreeItemLabel
        )
      );
    }
  }

  return treeItems;
}

export function getNodeIdsToExpand(
  nodeId: string,
  item: ItemsForTree | 1
): Array<string> {
  const nodeIdsToExpand: Array<string> = [nodeId];
  addNodeIdsToExpand(nodeIdsToExpand, item);
  return nodeIdsToExpand;
}

function addNodeIdsToExpand(
  nodeIdsToExpand: Array<string>,
  item: ItemsForTree | 1
): void {
  const containedNodes = Object.keys(item);
  if (item !== 1 && containsExactlyOneFolder(item, containedNodes)) {
    nodeIdsToExpand.push(
      getNodeIdOfFirstContainedNode(containedNodes, nodeIdsToExpand, item)
    );
    addNodeIdsToExpand(nodeIdsToExpand, item[containedNodes[0]]);
  }
}

function containsExactlyOneFolder(
  item: ItemsForTree,
  containedNodes: Array<string>
): boolean {
  return (
    containedNodes.length === 1 && canItemHaveChildren(item[containedNodes[0]])
  );
}

function getNodeIdOfFirstContainedNode(
  containedNodes: Array<string>,
  nodeIdsToExpand: Array<string>,
  item: ItemsForTree
): string {
  const latestNodeIdToExpand = nodeIdsToExpand[nodeIdsToExpand.length - 1];
  return getNodeId(
    containedNodes[0],
    latestNodeIdToExpand,
    canItemHaveChildren(item[containedNodes[0]])
  );
}

function getNodeId(itemName: string, path: string, isFolder: boolean): string {
  return path + (isFolder ? itemName + '/' : itemName);
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

function isSelected(nodeId: string, selected: string): boolean {
  return nodeId === selected;
}

export function isChildOfSelected(nodeId: string, selected: string): boolean {
  return (
    nodeId.startsWith(selected) &&
    !isSelected(nodeId, selected) &&
    selected.slice(-1) === '/'
  );
}

function getSortFunction(
  items: ItemsForTree,
  isFileWithChildren: PathPredicateForTree,
  path: string
) {
  return (left: string, right: string): number => {
    const leftItem = items[left];
    const rightItem = items[right];
    const leftIsFolderOrFileWithChildren = canItemHaveChildren(leftItem);
    const rightIsFolderOrFileWithChildren = canItemHaveChildren(rightItem);
    const leftNodeId = getNodeId(left, path, leftIsFolderOrFileWithChildren);
    const rightNodeId = getNodeId(right, path, rightIsFolderOrFileWithChildren);

    const leftItemIsFolder =
      leftIsFolderOrFileWithChildren && !isFileWithChildren(leftNodeId);
    const rightItemIsFolder =
      rightIsFolderOrFileWithChildren && !isFileWithChildren(rightNodeId);

    if (leftItemIsFolder && !rightItemIsFolder) {
      return -1;
    } else if (!leftItemIsFolder && rightItemIsFolder) {
      return 1;
    }
    return left.toLowerCase().localeCompare(right.toLowerCase());
  };
}

function canItemHaveChildren(item: ItemsForTree | 1): item is ItemsForTree {
  return item !== 1;
}

function isIdOfNodeWithChildren(nodeId: string): boolean {
  return nodeId.slice(-1) === '/';
}
