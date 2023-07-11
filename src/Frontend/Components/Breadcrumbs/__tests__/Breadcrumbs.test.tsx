// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { render, screen } from '@testing-library/react';
import { doNothing } from '../../../util/do-nothing';
import { Breadcrumbs } from '../Breadcrumbs';
import React from 'react';

describe('Breadcrumbs', () => {
  it('renders breadcrumbs', () => {
    const testIdToSelectedValue: Array<[string, string]> = [
      ['package_id', 'package'],
      ['version_id', 'version'],
    ];
    render(
      <Breadcrumbs
        selectedId={'package_id'}
        onClick={doNothing}
        idsToDisplayValues={testIdToSelectedValue}
      />,
    );

    expect(screen.getByText('package')).toBeInTheDocument();
    expect(screen.getByText('version')).toBeInTheDocument();
  });
});
