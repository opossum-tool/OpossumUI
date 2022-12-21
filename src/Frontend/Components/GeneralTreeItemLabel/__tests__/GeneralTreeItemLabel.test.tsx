// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { render, screen } from '@testing-library/react';
import React from 'react';
import { GeneralTreeItemLabel } from '../GeneralTreeItemLabel';

describe('StyledTreeItemLabel', () => {
  it('renders a file without information', () => {
    render(
      <GeneralTreeItemLabel
        labelText={'Test label'}
        canHaveChildren={false}
        isAttributionBreakpoint={false}
        showFolderIcon={false}
      />
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.queryByLabelText('Attribution icon')).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('File icon without information')
    ).toBeInTheDocument();
  });

  it('renders a folder without information', () => {
    render(
      <GeneralTreeItemLabel
        labelText={'Test label'}
        canHaveChildren={true}
        isAttributionBreakpoint={false}
        showFolderIcon={true}
      />
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon without information')
    ).toBeInTheDocument();
  });

  it('renders a breakpoint', () => {
    render(
      <GeneralTreeItemLabel
        labelText={'Test label'}
        canHaveChildren={true}
        isAttributionBreakpoint={true}
        showFolderIcon={true}
      />
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.getByLabelText('Breakpoint icon')).toBeInTheDocument();
  });
});
