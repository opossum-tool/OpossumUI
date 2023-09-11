// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { VirtualizedTree } from '../VirtualizedTree';
import { fireEvent, screen } from '@testing-library/react';
import { NodesForTree } from '../types';
import {
  createTestAppStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { setLocatePopupSelectedCriticality } from '../../../state/actions/resource-actions/locate-popup-actions';
import { SelectedCriticality } from '../../../types/types';
import { getOpenPopup } from '../../../state/selectors/view-selector';

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

  const testVirtualizedTree = (
    <VirtualizedTree
      expandedIds={['/', '/thirdParty/', '/root/', '/root/src/', 'docs/']}
      isFakeNonExpandableNode={(path: string): boolean => Boolean(path)}
      onSelect={(): void => {}}
      onToggle={(): void => {}}
      nodes={testNodes}
      selectedNodeId={'/thirdParty/'}
      getTreeNodeLabel={
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (nodeName, node, nodeId): ReactElement => <div>{nodeName || '/'}</div>
      }
      breakpoints={new Set()}
      cardHeight={20}
      maxHeight={5000}
    />
  );

  it('renders VirtualizedTree', () => {
    renderComponentWithStore(testVirtualizedTree);

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
  });

  it('does not display the filter icon when no resources have been filtered', () => {
    renderComponentWithStore(testVirtualizedTree);
    expect(
      screen.queryByLabelText('filter attributions'),
    ).not.toBeInTheDocument();
  });

  it('displays the filter icon after resources have been filtered', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(
      setLocatePopupSelectedCriticality(SelectedCriticality.Medium),
    );
    renderComponentWithStore(testVirtualizedTree, { store: testStore });

    expect(screen.getByLabelText('filter attributions')).toBeInTheDocument();

    fireEvent.click(screen.queryByLabelText('filter attributions') as Element);

    expect(getOpenPopup(testStore.getState())).toBe('LocatorPopup');
  });
});
