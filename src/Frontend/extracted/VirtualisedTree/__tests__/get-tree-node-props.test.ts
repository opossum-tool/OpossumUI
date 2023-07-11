// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  getNodeIdsToExpand,
  isBreakpointOrChildOfBreakpoint,
  isChildOfSelected,
  isSelected,
} from '../utils/get-tree-node-props';
import { NodesForTree } from '../types';

describe('renderTree', () => {
  it('isSelected works as expected', () => {
    const firstNodeId = '/adapters/.settings/org';
    const secondNodeId = '/adapters/.settings';
    const selectedNodeId = '/adapters/.settings';
    expect(isSelected(firstNodeId, selectedNodeId)).toBe(false);
    expect(isSelected(secondNodeId, selectedNodeId)).toBe(true);
  });

  it('isChildOfSelected works as expected', () => {
    const nodeId = '/adapters/';
    const firstChildNodeId = '/adapters/.settings/org';
    const secondChildNodeId = '/adapters/.settings/';
    const firstNotChild = '/release.sh';
    const secondNotChild = '/adapters/';
    expect(isChildOfSelected(firstChildNodeId, nodeId)).toBe(true);
    expect(isChildOfSelected(secondChildNodeId, nodeId)).toBe(true);
    expect(isChildOfSelected(firstNotChild, nodeId)).toBe(false);
    expect(isChildOfSelected(secondNotChild, nodeId)).toBe(false);
  });

  it('isBreakpointOrChildOfBreakpoint works as expected', () => {
    const parentNodeId = '/adapters/';
    const firstChildNodeId = '/adapters/.settings/';
    const secondChildNodeId = '/adapters/.settings/org';
    const breakpoints = new Set<string>().add(firstChildNodeId);

    expect(
      isBreakpointOrChildOfBreakpoint(firstChildNodeId, parentNodeId),
    ).toBe(false);
    expect(
      isBreakpointOrChildOfBreakpoint(
        firstChildNodeId,
        parentNodeId,
        new Set<string>(),
      ),
    ).toBe(false);
    expect(
      isBreakpointOrChildOfBreakpoint(parentNodeId, parentNodeId, breakpoints),
    ).toBe(false);
    expect(
      isBreakpointOrChildOfBreakpoint(
        firstChildNodeId,
        parentNodeId,
        breakpoints,
      ),
    ).toBe(true);
    expect(
      isBreakpointOrChildOfBreakpoint(
        secondChildNodeId,
        parentNodeId,
        breakpoints,
      ),
    ).toBe(true);
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
