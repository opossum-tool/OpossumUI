// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { ROOT_PATH } from '../../../shared-constants';
import { renderComponent } from '../../../test-helpers/render';
import { VirtualizedTree } from '../VirtualizedTree';

describe('The VirtualizedTree', () => {
  it('renders VirtualizedTree', () => {
    renderComponent(
      <VirtualizedTree
        expandedIds={['/', '/thirdParty/', '/root/', '/root/src/', '/docs/']}
        onSelect={jest.fn()}
        onToggle={jest.fn()}
        resourceIds={[
          '/thirdParty/package_1.tr.gz',
          '/thirdParty/package_2.tr.gz',
          '/root/src/something.js',
          '/root/package.json',
          '/docs/readme.md',
        ]}
        selectedNodeId={'/thirdParty/'}
        TreeNodeLabel={({ nodeName }) => <div>{nodeName || '/'}</div>}
      />,
    );

    for (const label of [
      ROOT_PATH,
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
