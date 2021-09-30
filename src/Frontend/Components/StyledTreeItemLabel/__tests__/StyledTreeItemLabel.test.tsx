// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
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

    expect(screen.queryAllByText('Test label')).toBeTruthy();
    expect(screen.queryByLabelText('Attribution icon')).toBeNull();
    expect(
      screen.queryByLabelText('File icon without information')
    ).toBeTruthy();
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

    expect(screen.queryAllByText('Test label')).toBeTruthy();
    expect(
      screen.queryByLabelText('Directory icon with attribution')
    ).toBeTruthy();
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

    expect(screen.queryAllByText('Test label')).toBeTruthy();
    expect(screen.queryByLabelText('Signal icon')).not.toBeNull();
    expect(screen.queryByLabelText('Directory icon with signal')).toBeTruthy();
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

    expect(screen.queryAllByText('Test label')).toBeTruthy();
    expect(screen.queryByLabelText('Signal icon')).not.toBeNull();
    expect(
      screen.queryByLabelText('Directory icon without information')
    ).toBeTruthy();
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

    expect(screen.queryAllByText('Test label')).toBeTruthy();
    expect(screen.queryByLabelText('Signal icon')).not.toBeNull();
    expect(screen.queryByLabelText('File icon with attribution')).toBeTruthy();
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

    expect(screen.queryAllByText('Test label')).toBeTruthy();
    expect(
      screen.queryByLabelText('Directory icon containing signals')
    ).toBeTruthy();
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

    expect(screen.queryAllByText('Test label')).toBeTruthy();
    expect(
      screen.queryByLabelText('Directory icon containing attributions')
    ).toBeTruthy();
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

    expect(screen.queryAllByText('Test label')).toBeTruthy();
    expect(
      screen.queryByLabelText('Directory icon with parent attribution')
    ).toBeTruthy();
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

    expect(screen.queryAllByText('Test label')).toBeTruthy();
    expect(
      screen.queryByLabelText('Directory icon without information')
    ).toBeTruthy();
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

    expect(screen.queryAllByText('Test label')).toBeTruthy();
    expect(screen.queryByLabelText('Breakpoint icon')).toBeTruthy();
  });
});
