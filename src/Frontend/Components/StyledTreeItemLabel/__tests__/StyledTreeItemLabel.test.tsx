// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { render } from '@testing-library/react';
import React from 'react';

import { StyledTreeItemLabel } from '../StyledTreeItemLabel';

describe('StyledTreeItemLabel', () => {
  test('renders a file without information', () => {
    const { queryAllByText, queryByLabelText } = render(
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

    expect(queryAllByText('Test label')).toBeTruthy();
    expect(queryByLabelText('Attribution icon')).toBeNull();
    expect(queryByLabelText('File icon without information')).toBeTruthy();
  });

  test('renders a folder with attribution', () => {
    const { queryAllByText, queryByLabelText } = render(
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

    expect(queryAllByText('Test label')).toBeTruthy();
    expect(queryByLabelText('Directory icon with attribution')).toBeTruthy();
  });

  test('renders a folder with signal and icon', () => {
    const { queryAllByText, queryByLabelText } = render(
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

    expect(queryAllByText('Test label')).toBeTruthy();
    expect(queryByLabelText('Signal icon')).not.toBeNull();
    expect(queryByLabelText('Directory icon with signal')).toBeTruthy();
  });

  test('renders a folder with resolved signal and icon', () => {
    const { queryAllByText, queryByLabelText } = render(
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

    expect(queryAllByText('Test label')).toBeTruthy();
    expect(queryByLabelText('Signal icon')).not.toBeNull();
    expect(queryByLabelText('Directory icon without information')).toBeTruthy();
  });

  test('renders a file with resolved signal and icon', () => {
    const { queryAllByText, queryByLabelText } = render(
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

    expect(queryAllByText('Test label')).toBeTruthy();
    expect(queryByLabelText('Signal icon')).not.toBeNull();
    expect(queryByLabelText('File icon with attribution')).toBeTruthy();
  });

  test('renders a folder with contained signals', () => {
    const { queryAllByText, queryByLabelText } = render(
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

    expect(queryAllByText('Test label')).toBeTruthy();
    expect(queryByLabelText('Directory icon containing signals')).toBeTruthy();
  });

  test('renders a folder with contained attributions', () => {
    const { queryAllByText, queryByLabelText } = render(
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

    expect(queryAllByText('Test label')).toBeTruthy();
    expect(
      queryByLabelText('Directory icon containing attributions')
    ).toBeTruthy();
  });

  test('renders a file with parent attribution', () => {
    const { queryAllByText, queryByLabelText } = render(
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

    expect(queryAllByText('Test label')).toBeTruthy();
    expect(
      queryByLabelText('Directory icon with parent attribution')
    ).toBeTruthy();
  });

  test('renders a folder without information', () => {
    const { queryAllByText, queryByLabelText } = render(
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

    expect(queryAllByText('Test label')).toBeTruthy();
    expect(queryByLabelText('Directory icon without information')).toBeTruthy();
  });

  test('renders a breakpoint', () => {
    const { queryAllByText, queryByLabelText } = render(
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

    expect(queryAllByText('Test label')).toBeTruthy();
    expect(queryByLabelText('Breakpoint icon')).toBeTruthy();
  });
});
