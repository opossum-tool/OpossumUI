// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from 'react';
import { VirtualizedTree } from '../VirtualizedTree';
import { screen } from '@testing-library/react';
import { NodesForTree } from '../types';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { Button } from '@mui/material';

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

  it('renders VirtualizedTree, no locator icon', () => {
    renderComponentWithStore(
      <VirtualizedTree
        expandedIds={['/', '/thirdParty/', '/root/', '/root/src/', 'docs/']}
        isFakeNonExpandableNode={(path: string): boolean => Boolean(path)}
        onSelect={(): void => {}}
        onToggle={(): void => {}}
        nodes={testNodes}
        selectedNodeId={'/thirdParty/'}
        getTreeNodeLabel={(nodeName): ReactElement => (
          <div>{nodeName || '/'}</div>
        )}
        breakpoints={new Set()}
        cardHeight={20}
        maxHeight={5000}
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
      expect(screen.getByText(label));
    }

    expect(
      screen.queryByLabelText('locate attributions'),
    ).not.toBeInTheDocument();
  });

  it('renders VirtualizedTree with the locator icon', () => {
    const locatorIcon = <Button aria-label={'locator icon'} />;
    renderComponentWithStore(
      <VirtualizedTree
        expandedIds={['/', '/thirdParty/', '/root/', '/root/src/', 'docs/']}
        isFakeNonExpandableNode={(path: string): boolean => Boolean(path)}
        onSelect={(): void => {}}
        onToggle={(): void => {}}
        nodes={testNodes}
        selectedNodeId={'/thirdParty/'}
        getTreeNodeLabel={(nodeName): ReactElement => (
          <div>{nodeName || '/'}</div>
        )}
        breakpoints={new Set()}
        cardHeight={20}
        maxHeight={5000}
        locatorIcon={locatorIcon}
      />,
    );

    expect(screen.getByLabelText('locator icon')).toBeInTheDocument();
  });
});
