// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Resources } from '../../../../shared/shared-types';

export function getNodeIdsToExpand(
  nodeId: string,
  node: Resources | 1,
): Array<string> {
  const nodeIdsToExpand = [nodeId];
  addNodeIdsToExpand(nodeIdsToExpand, node);
  return nodeIdsToExpand;
}

function addNodeIdsToExpand(
  nodeIdsToExpand: Array<string>,
  node: Resources | 1,
): void {
  const containedNodes = Object.keys(node);
  const firstContainedNode = containedNodes[0];
  if (
    node !== 1 &&
    containedNodes.length === 1 &&
    node[firstContainedNode] !== 1
  ) {
    nodeIdsToExpand.push(
      `${nodeIdsToExpand[nodeIdsToExpand.length - 1]}${firstContainedNode}/`,
    );
    addNodeIdsToExpand(nodeIdsToExpand, node[firstContainedNode]);
  }
}
