// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
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
        externalAttributions={{}}
        isAttributionBreakpoint={(path: string): boolean => !path}
        isFileWithChildren={(path: string): boolean => Boolean(path)}
        manualAttributions={{}}
        onSelect={doNothing}
        onToggle={doNothing}
        resolvedExternalAttributions={new Set()}
        resources={testResources}
        resourcesToExternalAttributions={{}}
        resourcesToManualAttributions={{}}
        resourcesWithExternalAttributedChildren={{}}
        resourcesWithManualAttributedChildren={{}}
        selectedResourceId={'/thirdParty/'}
      />
    );
    expect(screen.getByText('/'));
    expect(screen.getByText('thirdParty'));
    expect(screen.getByText('root'));
  });
});
