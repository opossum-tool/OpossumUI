// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { VirtualizedTree } from '../VirtualizedTree';
import { render, screen } from '@testing-library/react';
import { Resources } from '../../../../shared/shared-types';
import { doNothing } from '../../../util/do-nothing';

describe('The VirtualizedTree', () => {
  const testResources: Resources = {
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
        onSelect={doNothing}
        onToggle={doNothing}
        resources={testResources}
        selectedResourceId={'/thirdParty/'}
        getTreeItemLabel={
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          (resourceName, resource, nodeId): ReactElement => (
            <div>{resourceName || '/'}</div>
          )
        }
        cardHeight={20}
        maxHeight={5000}
        cardHeight={20}
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
