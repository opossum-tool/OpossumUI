// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { View } from '../../../enums/enums';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { fireEvent, screen } from '@testing-library/react';
import { getSelectedView } from '../../../state/selectors/view-selector';
import {
  getExpandedIds,
  getSelectedResourceId,
} from '../../../state/selectors/audit-view-resource-selectors';
import { ResourcesTree } from '../ResourcesTree';

describe('The ResourcesTree', () => {
  const resourcePaths = ['/folder1/folder2/resource_1', '/resource_2'];

  const expectedExpandedIds = [
    '/',
    '/folder1/',
    '/folder1/folder2/',
    '/folder1/folder2/resource_1',
  ];

  it('expands all folders', () => {
    renderComponentWithStore(
      <ResourcesTree
        resourcePaths={resourcePaths}
        highlightSelectedResources={true}
      />,
    );
    expect(screen.getByText('resource_1')).toBeInTheDocument();
    expect(screen.getByText('resource_2')).toBeInTheDocument();
  });

  it('changes the view, selectedResourceId and expandedResources when a resource is clicked', () => {
    const { store } = renderComponentWithStore(
      <ResourcesTree
        resourcePaths={resourcePaths}
        highlightSelectedResources={true}
      />,
    );
    fireEvent.click(screen.getByText('resource_1'));

    expect(getSelectedResourceId(store.getState())).toBe(
      '/folder1/folder2/resource_1',
    );
    expect(getSelectedView(store.getState())).toBe(View.Audit);
    expect(getExpandedIds(store.getState())).toMatchObject(expectedExpandedIds);
  });

  it('collapses and expands folders', () => {
    renderComponentWithStore(
      <ResourcesTree
        resourcePaths={resourcePaths}
        highlightSelectedResources={true}
      />,
    );
    expect(screen.getByText('resource_1')).toBeInTheDocument();

    const collapseIcon = screen.getByLabelText('collapse /folder1/');
    fireEvent.click(collapseIcon);
    expect(screen.queryByText('resource_1')).not.toBeInTheDocument();

    const expandIcon = screen.getByLabelText('expand /folder1/');
    fireEvent.click(expandIcon);
    expect(screen.getByText('resource_1')).toBeInTheDocument();
  });
});
