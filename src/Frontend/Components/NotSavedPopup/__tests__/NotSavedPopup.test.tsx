// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent } from '@testing-library/react';
import { IpcRenderer } from 'electron';
import React from 'react';
import { ButtonTitle, View } from '../../../enums/enums';
import {
  openNotSavedPopup,
  setTargetView,
} from '../../../state/actions/view-actions/view-actions';
import { getTemporaryPackageInfo } from '../../../state/selectors/all-views-resource-selectors';
import {
  getOpenPopup,
  isAttributionViewSelected,
  isAuditViewSelected,
} from '../../../state/selectors/view-selector';
import {
  EnhancedTestStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { getEmptyParsedInputFile } from '../../../test-helpers/test-helpers';
import { NotSavedPopup } from '../NotSavedPopup';
import {
  setSelectedResourceId,
  setTargetSelectedResourceId,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { setTemporaryPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { getSelectedResourceId } from '../../../state/selectors/audit-view-resource-selectors';

function setupTestState(store: EnhancedTestStore, targetView?: View): void {
  store.dispatch(openNotSavedPopup());
  store.dispatch(setTargetSelectedResourceId('test_id'));
  store.dispatch(setSelectedResourceId(''));
  store.dispatch(loadFromFile(getEmptyParsedInputFile()));
  targetView && store.dispatch(setTargetView(targetView));
}

let originalIpcRenderer: IpcRenderer;

describe('NotSavedPopup and do not change view', () => {
  beforeAll(() => {
    originalIpcRenderer = global.window.ipcRenderer;
    global.window.ipcRenderer = {
      on: jest.fn(),
      invoke: jest.fn(),
    } as unknown as IpcRenderer;
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(() => {
    // Important to restore the original value.
    global.window.ipcRenderer = originalIpcRenderer;
  });

  test('renders a NotSavedPopup', () => {
    const { queryByText, store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store);

    expect(queryByText('Warning')).toBeTruthy();
    fireEvent.click(queryByText(ButtonTitle.Save) as Element);
    expect(getOpenPopup(store.getState())).toBe(null);
    expect(getSelectedResourceId(store.getState())).toBe('test_id');
    expect(isAuditViewSelected(store.getState())).toBe(true);
  });

  test('renders a NotSavedPopup and click cancel', () => {
    const { queryByText, store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store);

    expect(queryByText('There are unsaved changes.')).toBeTruthy();
    fireEvent.click(queryByText('Cancel') as Element);
    expect(getOpenPopup(store.getState())).toBeFalsy();
    expect(getSelectedResourceId(store.getState())).toBe('');
    expect(isAuditViewSelected(store.getState())).toBe(true);
  });

  test('renders a NotSavedPopup and click reset', () => {
    const { queryByText, store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store);
    store.dispatch(setTemporaryPackageInfo({ packageName: 'test name' }));

    expect(queryByText('Warning')).toBeTruthy();
    expect(getTemporaryPackageInfo(store.getState())).toEqual({
      packageName: 'test name',
    });

    fireEvent.click(queryByText(ButtonTitle.Undo) as Element);
    expect(getOpenPopup(store.getState())).toBe(null);
    expect(getSelectedResourceId(store.getState())).toBe('test_id');
    expect(getTemporaryPackageInfo(store.getState())).toEqual({});
    expect(isAuditViewSelected(store.getState())).toBe(true);
  });
});

describe('NotSavedPopup and change view', () => {
  beforeAll(() => {
    originalIpcRenderer = global.window.ipcRenderer;
    global.window.ipcRenderer = {
      on: jest.fn(),
      invoke: jest.fn(),
    } as unknown as IpcRenderer;
  });

  beforeEach(() => jest.clearAllMocks());

  afterAll(() => {
    // Important to restore the original value.
    global.window.ipcRenderer = originalIpcRenderer;
  });

  test('renders a NotSavedPopup', () => {
    const { queryByText, store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store, View.Attribution);

    expect(queryByText('Warning')).toBeTruthy();
    fireEvent.click(queryByText(ButtonTitle.Save) as Element);
    expect(getOpenPopup(store.getState())).toBeFalsy();
    expect(getSelectedResourceId(store.getState())).toBe('test_id');
    expect(isAttributionViewSelected(store.getState())).toBe(true);
  });

  test('renders a NotSavedPopup and click cancel', () => {
    const { queryByText, store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store, View.Attribution);

    expect(queryByText('Warning')).toBeTruthy();
    fireEvent.click(queryByText('Cancel') as Element);
    expect(getOpenPopup(store.getState())).toBeFalsy();
    expect(getSelectedResourceId(store.getState())).toBe('');
    expect(isAuditViewSelected(store.getState())).toBe(true);
  });

  test('renders a NotSavedPopup and click reset', () => {
    const { queryByText, store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store, View.Attribution);
    store.dispatch(setTemporaryPackageInfo({ packageName: 'test name' }));

    expect(queryByText('Warning')).toBeTruthy();
    expect(getTemporaryPackageInfo(store.getState())).toEqual({
      packageName: 'test name',
    });

    fireEvent.click(queryByText(ButtonTitle.Undo) as Element);
    expect(getOpenPopup(store.getState())).toBeFalsy();
    expect(getSelectedResourceId(store.getState())).toBe('test_id');
    expect(getTemporaryPackageInfo(store.getState())).toEqual({});
    expect(isAttributionViewSelected(store.getState())).toBe(true);
  });
});
