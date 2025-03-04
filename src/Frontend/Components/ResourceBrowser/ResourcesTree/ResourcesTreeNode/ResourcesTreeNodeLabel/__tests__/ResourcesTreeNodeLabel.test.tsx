// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';

import { Criticality } from '../../../../../../../shared/shared-types';
import { ResourcesTreeNodeLabel } from '../ResourcesTreeNodeLabel';

describe('ResourcesTreeNodeLabel', () => {
  it('renders a file without information', () => {
    render(
      <ResourcesTreeNodeLabel
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
        containsResourcesWithOnlyExternalAttribution={true}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.queryByLabelText('Attribution icon')).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('File icon without information'),
    ).toBeInTheDocument();
  });

  it('renders a folder with attribution', () => {
    render(
      <ResourcesTreeNodeLabel
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
        containsResourcesWithOnlyExternalAttribution={true}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon with attribution'),
    ).toBeInTheDocument();
  });

  it('renders a folder with signal and criticality icon', () => {
    render(
      <ResourcesTreeNodeLabel
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
        containsResourcesWithOnlyExternalAttribution={true}
        criticality={Criticality.High}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.getByLabelText('Criticality icon')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon with signal'),
    ).toBeInTheDocument();
  });

  it('renders a folder with resolved signal but without criticality icon', () => {
    render(
      <ResourcesTreeNodeLabel
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
        containsResourcesWithOnlyExternalAttribution={true}
        criticality={Criticality.High}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.queryByLabelText('Criticality icon')).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon without information'),
    ).toBeInTheDocument();
  });

  it('renders a folder with signal and classification icon', () => {
    render(
      <ResourcesTreeNodeLabel
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
        containsResourcesWithOnlyExternalAttribution={true}
        classification={1}
        classificationsConfig={{ 1: 'Test' }}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.getByLabelText('Classification icon')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon with signal'),
    ).toBeInTheDocument();
  });

  it('renders a folder with resolved signal but without classification icon', () => {
    render(
      <ResourcesTreeNodeLabel
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
        containsResourcesWithOnlyExternalAttribution={true}
        classification={1}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Classification icon'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon without information'),
    ).toBeInTheDocument();
  });

  it('renders a file with resolved signal and icon', () => {
    render(
      <ResourcesTreeNodeLabel
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
        containsResourcesWithOnlyExternalAttribution={true}
        criticality={Criticality.High}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.getByLabelText('Criticality icon')).toBeInTheDocument();
    expect(
      screen.getByLabelText('File icon with attribution'),
    ).toBeInTheDocument();
  });

  it('renders a folder with contained signals', () => {
    render(
      <ResourcesTreeNodeLabel
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
        containsResourcesWithOnlyExternalAttribution={true}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon containing signals'),
    ).toBeInTheDocument();
  });

  it('renders a folder with contained attributions', () => {
    render(
      <ResourcesTreeNodeLabel
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
        containsResourcesWithOnlyExternalAttribution={true}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon containing attributions'),
    ).toBeInTheDocument();
  });

  it('renders a file with parent attribution', () => {
    render(
      <ResourcesTreeNodeLabel
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
        containsResourcesWithOnlyExternalAttribution={true}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon with parent attribution'),
    ).toBeInTheDocument();
  });

  it('renders a folder without information', () => {
    render(
      <ResourcesTreeNodeLabel
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
        containsResourcesWithOnlyExternalAttribution={true}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Directory icon without information'),
    ).toBeInTheDocument();
  });

  it('renders a folder with all children containing signal also containing attributions', () => {
    render(
      <ResourcesTreeNodeLabel
        labelText={'Test label'}
        hasManualAttribution={false}
        hasExternalAttribution={false}
        hasUnresolvedExternalAttribution={false}
        hasParentWithManualAttribution={false}
        containsExternalAttribution={true}
        containsManualAttribution={true}
        canHaveChildren={true}
        isAttributionBreakpoint={false}
        showFolderIcon={true}
        containsResourcesWithOnlyExternalAttribution={false}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        'Directory icon with all children containing signal also containing attributions',
      ),
    ).toBeInTheDocument();
  });

  it('renders a breakpoint', () => {
    render(
      <ResourcesTreeNodeLabel
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
        containsResourcesWithOnlyExternalAttribution={true}
      />,
    );

    expect(screen.getByText('Test label')).toBeInTheDocument();
    expect(screen.getByLabelText('Breakpoint icon')).toBeInTheDocument();
  });
});
