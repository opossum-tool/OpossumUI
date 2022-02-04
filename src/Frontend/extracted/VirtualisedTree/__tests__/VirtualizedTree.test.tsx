// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { VirtualizedTree } from '../VirtualizedTree';
import { render, screen } from '@testing-library/react';
import { ItemsForTree } from '../types';

describe('The VirtualizedTree', () => {
  const testItems: ItemsForTree = {
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

  test('renders VirtualizedTree', () => {
    render(
      <VirtualizedTree
        expandedIds={['/', '/thirdParty/', '/root/', '/root/src/', 'docs/']}
        isFileWithChildren={(path: string): boolean => Boolean(path)}
        onSelect={(): void => {}}
        onToggle={(): void => {}}
        items={testItems}
        selectedItemId={'/thirdParty/'}
        getTreeItemLabel={
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          (itemName, item, nodeId): ReactElement => <div>{itemName || '/'}</div>
        }
        cardHeight={20}
        maxHeight={5000}
      />
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
  });
});
