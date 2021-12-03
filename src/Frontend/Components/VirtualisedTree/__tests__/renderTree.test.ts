// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { getNodeIdsToExpand, isChildOfSelected } from '../renderTree';
import { Resources } from '../../../../shared/shared-types';

describe('renderTree', () => {
  test('isChildOfSelected works as expected', () => {
    const NodeId = '/adapters/';
    const firstChildNodeId = '/adapters/.settings/org';
    const secondChildNodeId = '/adapters/.settings/';
    const firstNotChild = '/release.sh';
    const secondNotChild = '/adapters/';
    expect(isChildOfSelected(firstChildNodeId, NodeId)).toBe(true);
    expect(isChildOfSelected(secondChildNodeId, NodeId)).toBe(true);
    expect(isChildOfSelected(firstNotChild, NodeId)).toBe(false);
    expect(isChildOfSelected(secondNotChild, NodeId)).toBe(false);
  });

  test('getNodeIdsToExpand returns correct nodeIds', () => {
    const nodeId = '/parent/';
    const resource: Resources | 1 = {
      directory: {
        subdirectory: { 'something.js': 1 },
      },
    };
    const expectedNodeIdsToExpand: Array<string> = [
      '/parent/',
      '/parent/directory/',
      '/parent/directory/subdirectory/',
    ];

    expect(getNodeIdsToExpand(nodeId, resource)).toEqual(
      expectedNodeIdsToExpand
    );
  });
});
