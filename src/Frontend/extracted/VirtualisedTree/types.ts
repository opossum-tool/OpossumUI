// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export interface HeightForTree {
  height: number;
}

export interface NumberOfDisplayedItemsForTree {
  numberOfDisplayedItems: number;
}

export interface PathPredicateForTree {
  (path: string): boolean;
}

export interface ItemsForTree {
  [itemName: string]: ItemsForTree | 1;
}

export interface TreeItemStyle {
  root: string;
  childrenOfSelected: string;
  selected: string;
  treeExpandIcon: string;
}
