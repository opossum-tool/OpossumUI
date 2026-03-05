// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { View } from '../../../../enums/enums';
import { createAppStore } from '../../../configure-store';
import {
  getExpandedIds,
  getSelectedAttributionId,
  getSelectedResourceId,
  getTargetSelectedAttributionId,
  getTargetSelectedResourceId,
} from '../../../selectors/resource-selectors';
import { getSelectedView } from '../../../selectors/view-selector';
import { navigateToView, setTargetView } from '../../view-actions/view-actions';
import {
  setSelectedAttributionId,
  setSelectedResourceId,
  setTargetSelectedAttributionId,
  setTargetSelectedResourceId,
} from '../audit-view-simple-actions';
import {
  openResourceInResourceBrowser,
  setSelectedResourceOrAttributionIdToTargetValue,
} from '../navigation-actions';

describe('setSelectedResourceOrAttributionIdToTargetValue', () => {
  it('sets target selected resource ID', () => {
    const testStore = createAppStore();
    testStore.dispatch(navigateToView(View.Audit));
    testStore.dispatch(setTargetView(View.Report));
    testStore.dispatch(setSelectedResourceId('previousResourceId'));
    testStore.dispatch(setTargetSelectedResourceId('newResourceId'));

    testStore.dispatch(setSelectedResourceOrAttributionIdToTargetValue());

    const state = testStore.getState();
    expect(getSelectedView(state)).toBe(View.Audit);
    expect(getSelectedResourceId(state)).toBe('newResourceId');
    expect(getTargetSelectedResourceId(state)).toBeNull();
  });

  it('sets target selected attribution ID', () => {
    const testStore = createAppStore();
    testStore.dispatch(navigateToView(View.Audit));
    testStore.dispatch(setTargetView(View.Audit));
    testStore.dispatch(setSelectedAttributionId('previousAttributionId'));
    testStore.dispatch(setTargetSelectedAttributionId('newAttributionId'));

    testStore.dispatch(setSelectedResourceOrAttributionIdToTargetValue());

    const state = testStore.getState();
    expect(getSelectedView(state)).toBe(View.Audit);
    expect(getSelectedAttributionId(state)).toBe('newAttributionId');
    expect(getTargetSelectedAttributionId(state)).toBeNull();
  });
});

describe('setSelectedResourceIdAndExpand', () => {
  it('sets the selectedResourceId', () => {
    const testStore = createAppStore();
    testStore.dispatch(openResourceInResourceBrowser('/folder1/folder2/test'));
    const state = testStore.getState();
    expect(getSelectedResourceId(state)).toBe('/folder1/folder2/test');
  });

  it('sets the expandedIds', () => {
    const testStore = createAppStore();
    testStore.dispatch(openResourceInResourceBrowser('/folder1/folder2/test'));
    const state = testStore.getState();
    expect(getExpandedIds(state)).toMatchObject([
      '/',
      '/folder1/',
      '/folder1/folder2/',
      '/folder1/folder2/test',
    ]);
  });
});
