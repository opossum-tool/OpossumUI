// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export interface HeightForTree {
  height: number;
}

export interface NumberOfDisplayedNodesForTree {
  numberOfDisplayedNodes: number;
}

export interface NodeIdPredicateForTree {
  (path: string): boolean;
}

export interface NodesForTree {
  [nodeName: string]: NodesForTree | 1;
}

export interface TreeNodeStyle {
  root: string;
  childrenOfSelected: string;
  selected: string;
  treeExpandIcon: string;
}
