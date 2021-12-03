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
    thirdParty: {
      'package_1.tr.gz': 1,
      'package_2.tr.gz': 1,
    },
    root: {
      src: {
        'something.js': 1,
      },
      'readme.md': 1,
    },
  };

  test('renders VirtualizedTree', () => {
    render(
      <VirtualizedTree
        expandedIds={['/']}
        isFileWithChildren={(path: string): boolean => Boolean(path)}
        onSelect={doNothing}
        onToggle={doNothing}
        resources={testResources}
        selectedResourceId={'/thirdParty/'}
        getTreeItemLabel={(resourceName, resource, nodeId): ReactElement => (
          <div>{nodeId}</div>
        )}
      />
    );
    expect(screen.getByText('/'));
    expect(screen.getByText('/thirdParty/'));
    expect(screen.getByText('/root/'));
  });
});
