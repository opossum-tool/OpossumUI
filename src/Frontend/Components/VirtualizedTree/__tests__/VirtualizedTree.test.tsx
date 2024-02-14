// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { ReactElement } from 'react';

import { renderComponent } from '../../../test-helpers/render';
import { VirtualizedTree } from '../VirtualizedTree';
import { NodesForTree } from '../VirtualizedTree.util';

describe('The VirtualizedTree', () => {
  const testNodes: NodesForTree = {
    '': {
      thirdParty: {
        'package_1.tr.gz': 1,
        'package_2.tr.gz': 1,
      },
      root: {
        src: {
          'something.js': 1,
        },
        'package.json': 1,
      },
    },
    docs: { 'readme.md': 1 },
  };

  it('renders VirtualizedTree', () => {
    renderComponent(
      <VirtualizedTree
        expandedIds={['/', '/thirdParty/', '/root/', '/root/src/', 'docs/']}
        onSelect={(): void => {}}
        onToggle={(): void => {}}
        nodes={testNodes}
        selectedNodeId={'/thirdParty/'}
        getTreeNodeLabel={(nodeName): ReactElement => (
          <div>{nodeName || '/'}</div>
        )}
        breakpoints={new Set()}
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
