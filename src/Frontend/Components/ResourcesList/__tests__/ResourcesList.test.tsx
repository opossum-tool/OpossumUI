// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { View } from '../../../enums/enums';
import { ResourcesList } from '../ResourcesList';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import { navigateToView } from '../../../state/actions/view-actions/view-actions';
import { fireEvent } from '@testing-library/react';
import { getSelectedView } from '../../../state/selectors/view-selector';
import {
  getExpandedIds,
  getSelectedResourceId,
} from '../../../state/selectors/audit-view-resource-selectors';

describe('The ResourcesList', () => {
  const resourceIdsOfSelectedAttributionId = [
    '/folder1/folder2/resource_1',
    'resource_2',
  ];

  test('component renders', () => {
    const { getByText } = renderComponentWithStore(
      <ResourcesList resourceIds={resourceIdsOfSelectedAttributionId} />
    );
    expect(getByText('/folder1/folder2/resource_1')).toBeTruthy();
    expect(getByText('resource_2')).toBeTruthy();
  });
  test('clicking on a path changes the view, selectedResourceId and expandedResources without user callback', () => {
    const { getByText, store } = renderComponentWithStore(
      <ResourcesList resourceIds={resourceIdsOfSelectedAttributionId} />
    );
    store.dispatch(navigateToView(View.Attribution));

    fireEvent.click(getByText('/folder1/folder2/resource_1'));

    expect(getSelectedResourceId(store.getState())).toBe(
      '/folder1/folder2/resource_1'
    );
    expect(getSelectedView(store.getState())).toBe(View.Audit);
    expect(getExpandedIds(store.getState())).toMatchObject([
      '/',
      '/folder1/',
      '/folder1/folder2/',
      '/folder1/folder2/resource_1',
    ]);
  });
  test('clicking on a path changes the view, selectedResourceId and expandedResources with user callback', () => {
    const onClickCallback = jest.fn();
    const { getByText, store } = renderComponentWithStore(
      <ResourcesList
        resourceIds={resourceIdsOfSelectedAttributionId}
        onClickCallback={onClickCallback}
      />
    );
    store.dispatch(navigateToView(View.Attribution));

    fireEvent.click(getByText('/folder1/folder2/resource_1'));

    expect(onClickCallback).toHaveBeenCalled();
    expect(getSelectedResourceId(store.getState())).toBe(
      '/folder1/folder2/resource_1'
    );
    expect(getSelectedView(store.getState())).toBe(View.Audit);
    expect(getExpandedIds(store.getState())).toMatchObject([
      '/',
      '/folder1/',
      '/folder1/folder2/',
      '/folder1/folder2/resource_1',
    ]);
  });
});
