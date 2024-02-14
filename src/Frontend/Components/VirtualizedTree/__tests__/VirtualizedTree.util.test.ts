// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  getNodeIdsToExpand,
  isSelected,
  NodesForTree,
} from '../VirtualizedTree.util';

describe('renderTree', () => {
  it('isSelected works as expected', () => {
    const firstNodeId = '/adapters/.settings/org';
    const secondNodeId = '/adapters/.settings';
    const selectedNodeId = '/adapters/.settings';
    expect(isSelected(firstNodeId, selectedNodeId)).toBe(false);
    expect(isSelected(secondNodeId, selectedNodeId)).toBe(true);
  });

  it('getNodeIdsToExpand returns correct nodeIds', () => {
    const nodeId = '/parent/';
    const node: NodesForTree | 1 = {
      directory: {
        subdirectory: { 'something.js': 1 },
      },
    };
    const expectedNodeIdsToExpand: Array<string> = [
      '/parent/',
      '/parent/directory/',
      '/parent/directory/subdirectory/',
    ];

    expect(getNodeIdsToExpand(nodeId, node)).toEqual(expectedNodeIdsToExpand);
  });
});
