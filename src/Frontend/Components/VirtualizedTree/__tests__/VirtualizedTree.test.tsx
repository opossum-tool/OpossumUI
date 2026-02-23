// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { ResourceTreeNodeData } from '../../../../ElectronBackend/api/resourceTree';
import {
  makeResourceTreeNode,
  ROOT_TREE_NODE,
} from '../../../../testing/global-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { VirtualizedTree } from '../VirtualizedTree';

describe('The VirtualizedTree', () => {
  it('renders VirtualizedTree', async () => {
    const resources: Array<ResourceTreeNodeData> = [
      ROOT_TREE_NODE,
      makeResourceTreeNode({
        id: '/thirdParty/',
        isExpandable: true,
        isExpanded: true,
        canHaveChildren: true,
        isFile: false,
      }),
      makeResourceTreeNode({ id: '/thirdParty/package_1.tr.gz' }),
      makeResourceTreeNode({ id: '/thirdParty/package_2.tr.gz' }),
      makeResourceTreeNode({
        id: '/root/',
        isExpandable: true,
        isExpanded: true,
        canHaveChildren: true,
        isFile: false,
      }),
      makeResourceTreeNode({
        id: '/root/src/',
        isExpandable: true,
        isExpanded: true,
        canHaveChildren: true,
        isFile: false,
      }),
      makeResourceTreeNode({ id: '/root/src/something.js' }),
      makeResourceTreeNode({ id: '/root/package.json' }),
      makeResourceTreeNode({
        id: '/docs/',
        isExpandable: true,
        isExpanded: true,
        canHaveChildren: true,
        isFile: false,
      }),
      makeResourceTreeNode({ id: '/docs/readme.md' }),
    ];

    await renderComponent(
      <VirtualizedTree
        resources={resources}
        onSelect={vi.fn()}
        onToggle={vi.fn()}
        selectedNodeId={'/thirdParty/'}
        TreeNodeLabel={({ resource }) => <div>{resource.labelText}</div>}
      />,
    );

    for (const label of [
      '/',
      'thirdParty',
      'package_1.tr.gz',
      'package_2.tr.gz',
      'root',
      'src',
      'something.js',
      'package.json',
      'docs',
      'readme.md',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
