// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { render, screen } from '@testing-library/react';
import React from 'react';

import { StyledTreeItemLabel } from '../StyledTreeItemLabel';

describe('StyledTreeItemLabel', () => {
  test('renders a file without information', () => {
    render(
      <StyledTreeItemLabel
        labelText={'Test label'}
        hasManualAttribution={false}
        hasExternalAttribution={false}
        hasUnresolvedExternalAttribution={false}
        containsExternalAttribution={false}
        containsManualAttribution={false}
        hasParentWithManualAttribution={false}
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

  test('renders a folder with attribution', () => {
    render(
      <StyledTreeItemLabel
        labelText={'Test label'}
        hasManualAttribution={true}
        hasExternalAttribution={false}
        hasUnresolvedExternalAttribution={false}
        containsExternalAttribution={false}
        containsManualAttribution={false}
        hasParentWithManualAttribution={false}
        canHaveChildren={true}
        isAttributionBreakpoint={false}
        showFolderIcon={true}
      />
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon with attribution')
    ).toBeInTheDocument();
  });

  test('renders a folder with signal and icon', () => {
    render(
      <StyledTreeItemLabel
        labelText={'Test label'}
        hasManualAttribution={false}
        hasExternalAttribution={true}
        hasUnresolvedExternalAttribution={true}
        containsExternalAttribution={false}
        containsManualAttribution={false}
        hasParentWithManualAttribution={false}
        canHaveChildren={true}
        isAttributionBreakpoint={false}
        showFolderIcon={true}
      />
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.getByLabelText('Signal icon')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon with signal')
    ).toBeInTheDocument();
  });

  test('renders a folder with resolved signal and icon', () => {
    render(
      <StyledTreeItemLabel
        labelText={'Test label'}
        hasManualAttribution={false}
        hasExternalAttribution={true}
        hasUnresolvedExternalAttribution={false}
        containsExternalAttribution={false}
        containsManualAttribution={false}
        hasParentWithManualAttribution={false}
        canHaveChildren={true}
        isAttributionBreakpoint={false}
        showFolderIcon={true}
      />
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.getByLabelText('Signal icon')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon without information')
    ).toBeInTheDocument();
  });

  test('renders a file with resolved signal and icon', () => {
    render(
      <StyledTreeItemLabel
        labelText={'Test label'}
        hasManualAttribution={true}
        hasExternalAttribution={true}
        hasUnresolvedExternalAttribution={true}
        containsExternalAttribution={false}
        containsManualAttribution={false}
        hasParentWithManualAttribution={false}
        canHaveChildren={false}
        isAttributionBreakpoint={false}
        showFolderIcon={false}
      />
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.getByLabelText('Signal icon')).toBeInTheDocument();
    expect(
      screen.getByLabelText('File icon with attribution')
    ).toBeInTheDocument();
  });

  test('renders a folder with contained signals', () => {
    render(
      <StyledTreeItemLabel
        labelText={'Test label'}
        hasManualAttribution={false}
        hasExternalAttribution={false}
        hasUnresolvedExternalAttribution={false}
        containsExternalAttribution={true}
        containsManualAttribution={false}
        hasParentWithManualAttribution={false}
        canHaveChildren={true}
        isAttributionBreakpoint={false}
        showFolderIcon={true}
      />
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon containing signals')
    ).toBeInTheDocument();
  });

  test('renders a folder with contained attributions', () => {
    render(
      <StyledTreeItemLabel
        labelText={'Test label'}
        hasManualAttribution={false}
        hasExternalAttribution={false}
        hasUnresolvedExternalAttribution={false}
        containsExternalAttribution={false}
        containsManualAttribution={true}
        hasParentWithManualAttribution={false}
        canHaveChildren={true}
        isAttributionBreakpoint={false}
        showFolderIcon={true}
      />
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon containing attributions')
    ).toBeInTheDocument();
  });

  test('renders a file with parent attribution', () => {
    render(
      <StyledTreeItemLabel
        labelText={'Test label'}
        hasManualAttribution={false}
        hasExternalAttribution={false}
        hasUnresolvedExternalAttribution={false}
        containsExternalAttribution={false}
        containsManualAttribution={false}
        hasParentWithManualAttribution={true}
        canHaveChildren={true}
        isAttributionBreakpoint={false}
        showFolderIcon={true}
      />
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon with parent attribution')
    ).toBeInTheDocument();
  });

  test('renders a folder without information', () => {
    render(
      <StyledTreeItemLabel
        labelText={'Test label'}
        hasManualAttribution={false}
        hasExternalAttribution={false}
        hasUnresolvedExternalAttribution={false}
        hasParentWithManualAttribution={false}
        containsExternalAttribution={false}
        containsManualAttribution={false}
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

  test('renders a breakpoint', () => {
    render(
      <StyledTreeItemLabel
        labelText={'Test label'}
        hasManualAttribution={false}
        hasExternalAttribution={false}
        hasUnresolvedExternalAttribution={false}
        hasParentWithManualAttribution={false}
        containsExternalAttribution={false}
        containsManualAttribution={false}
        canHaveChildren={true}
        isAttributionBreakpoint={true}
        showFolderIcon={true}
      />
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.getByLabelText('Breakpoint icon')).toBeInTheDocument();
  });
});
