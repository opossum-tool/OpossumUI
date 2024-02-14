// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Resources } from '../../../shared/shared-types';
import { TreeNode } from './VirtualizedTreeNode/VirtualizedTreeNode';

export function getTreeNodes(
  resources: Resources,
  expandedIds: Array<string>,
  filesWithChildren: Set<string>,
  parentPath: string = '',
  treeNodes: Record<string, TreeNode> = {},
): Record<string, TreeNode> {
  return Object.keys(resources)
    .sort(getSortFunction(resources, filesWithChildren, parentPath))
    .reduce<Record<string, TreeNode>>((treeNodes, nodeName) => {
      const node = resources[nodeName];
      const isNodeWithChildren = node !== 1;
      const nodeId = getNodeId(nodeName, parentPath, isNodeWithChildren);

      treeNodes[nodeId] = {
        node,
        nodeId,
        nodeName,
      };

      if (expandedIds.includes(nodeId) && isNodeWithChildren) {
        getTreeNodes(node, expandedIds, filesWithChildren, nodeId, treeNodes);
      }

      return treeNodes;
    }, treeNodes);
}

function getNodeId(
  nodeName: string,
  parentPath: string,
  isNodeWithChildren: boolean,
): string {
  return parentPath + (isNodeWithChildren ? `${nodeName}/` : nodeName);
}

function getSortFunction(
  nodes: Resources,
  filesWithChildren: Set<string>,
  parentPath: string,
) {
  return (left: string, right: string): number => {
    const leftNode = nodes[left];
    const rightNode = nodes[right];
    const leftIsFolderOrFileWithChildren = leftNode !== 1;
    const rightIsFolderOrFileWithChildren = rightNode !== 1;
    const leftNodeId = getNodeId(
      left,
      parentPath,
      leftIsFolderOrFileWithChildren,
    );
    const rightNodeId = getNodeId(
      right,
      parentPath,
      rightIsFolderOrFileWithChildren,
    );

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
