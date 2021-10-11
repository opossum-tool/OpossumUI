// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { fireEvent, screen } from '@testing-library/react';
import { IpcRenderer } from 'electron';
import React from 'react';
import { ButtonText, PopupType, View } from '../../../enums/enums';
import {
  openPopup,
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
import { EMPTY_PARSED_FILE_CONTENT } from '../../../test-helpers/test-helpers';
import { NotSavedPopup } from '../NotSavedPopup';
import {
  setSelectedResourceId,
  setTargetSelectedResourceId,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { setTemporaryPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { getSelectedResourceId } from '../../../state/selectors/audit-view-resource-selectors';

function setupTestState(store: EnhancedTestStore, targetView?: View): void {
  store.dispatch(openPopup(PopupType.NotSavedPopup));
  store.dispatch(setTargetSelectedResourceId('test_id'));
  store.dispatch(setSelectedResourceId(''));
  store.dispatch(loadFromFile(EMPTY_PARSED_FILE_CONTENT));
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
    const { store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store);

    expect(screen.queryByText('Warning')).toBeTruthy();
    fireEvent.click(screen.queryByText(ButtonText.Save) as Element);
    expect(getOpenPopup(store.getState())).toBe(null);
    expect(getSelectedResourceId(store.getState())).toBe('test_id');
    expect(isAuditViewSelected(store.getState())).toBe(true);
  });

  test('renders a NotSavedPopup and click cancel', () => {
    const { store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store);

    expect(screen.queryByText('There are unsaved changes.')).toBeTruthy();
    fireEvent.click(screen.queryByText('Cancel') as Element);
    expect(getOpenPopup(store.getState())).toBeFalsy();
    expect(getSelectedResourceId(store.getState())).toBe('');
    expect(isAuditViewSelected(store.getState())).toBe(true);
  });

  test('renders a NotSavedPopup and click reset', () => {
    const { store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store);
    store.dispatch(setTemporaryPackageInfo({ packageName: 'test name' }));

    expect(screen.queryByText('Warning')).toBeTruthy();
    expect(getTemporaryPackageInfo(store.getState())).toEqual({
      packageName: 'test name',
    });

    fireEvent.click(screen.queryByText(ButtonText.Undo) as Element);
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
    const { store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store, View.Attribution);

    expect(screen.queryByText('Warning')).toBeTruthy();
    fireEvent.click(screen.queryByText(ButtonText.Save) as Element);
    expect(getOpenPopup(store.getState())).toBeFalsy();
    expect(getSelectedResourceId(store.getState())).toBe('test_id');
    expect(isAttributionViewSelected(store.getState())).toBe(true);
  });

  test('renders a NotSavedPopup and click cancel', () => {
    const { store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store, View.Attribution);

    expect(screen.queryByText('Warning')).toBeTruthy();
    fireEvent.click(screen.queryByText('Cancel') as Element);
    expect(getOpenPopup(store.getState())).toBeFalsy();
    expect(getSelectedResourceId(store.getState())).toBe('');
    expect(isAuditViewSelected(store.getState())).toBe(true);
  });

  test('renders a NotSavedPopup and click reset', () => {
    const { store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store, View.Attribution);
    store.dispatch(setTemporaryPackageInfo({ packageName: 'test name' }));

    expect(screen.queryByText('Warning')).toBeTruthy();
    expect(getTemporaryPackageInfo(store.getState())).toEqual({
      packageName: 'test name',
    });

    fireEvent.click(screen.queryByText(ButtonText.Undo) as Element);
    expect(getOpenPopup(store.getState())).toBeFalsy();
    expect(getSelectedResourceId(store.getState())).toBe('test_id');
    expect(getTemporaryPackageInfo(store.getState())).toEqual({});
    expect(isAttributionViewSelected(store.getState())).toBe(true);
  });
});
