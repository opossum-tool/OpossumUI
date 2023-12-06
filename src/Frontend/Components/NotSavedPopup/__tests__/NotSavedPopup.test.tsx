// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';

import { ButtonText, PopupType, View } from '../../../enums/enums';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import {
  setSelectedResourceId,
  setTargetSelectedResourceId,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import {
  navigateToView,
  openPopup,
  setTargetView,
} from '../../../state/actions/view-actions/view-actions';
import { getTemporaryDisplayPackageInfo } from '../../../state/selectors/all-views-resource-selectors';
import { getSelectedResourceId } from '../../../state/selectors/audit-view-resource-selectors';
import {
  getOpenPopup,
  isAttributionViewSelected,
  isAuditViewSelected,
} from '../../../state/selectors/view-selector';
import {
  EnhancedTestStore,
  renderComponentWithStore,
} from '../../../test-helpers/render-component-with-store';
import { NotSavedPopup } from '../NotSavedPopup';

function setupTestState(
  store: EnhancedTestStore,
  targetView?: View,
  popupAttributionId?: string,
): void {
  store.dispatch(openPopup(PopupType.NotSavedPopup, popupAttributionId));
  store.dispatch(setTargetSelectedResourceId('test_id'));
  store.dispatch(setSelectedResourceId(''));
  targetView && store.dispatch(setTargetView(targetView));
}

describe('NotSavedPopup and do not change view', () => {
  it('renders a NotSavedPopup', () => {
    const { store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store);

    expect(screen.getByText('Warning')).toBeInTheDocument();
    fireEvent.click(screen.queryByText(ButtonText.Save) as Element);
    expect(getOpenPopup(store.getState())).toBe(null);
    expect(getSelectedResourceId(store.getState())).toBe('test_id');
    expect(isAuditViewSelected(store.getState())).toBe(true);
  });

  it('renders a NotSavedPopup and click cancel', () => {
    const { store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store);

    expect(screen.getByText('There are unsaved changes.')).toBeInTheDocument();
    fireEvent.click(screen.queryByText('Cancel') as Element);
    expect(getOpenPopup(store.getState())).toBeFalsy();
    expect(getSelectedResourceId(store.getState())).toBe('');
    expect(isAuditViewSelected(store.getState())).toBe(true);
  });

  it('renders a NotSavedPopup and click reset', () => {
    const { store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store);
    store.dispatch(
      setTemporaryDisplayPackageInfo({
        packageName: 'test name',
        attributionIds: [],
      }),
    );

    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual({
      packageName: 'test name',
      attributionIds: [],
    });

    fireEvent.click(screen.getByText(ButtonText.Discard));
    expect(getOpenPopup(store.getState())).toBe(null);
    expect(getSelectedResourceId(store.getState())).toBe('test_id');
    expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
      EMPTY_DISPLAY_PACKAGE_INFO,
    );
    expect(isAuditViewSelected(store.getState())).toBe(true);
  });

  it('renders a NotSavedPopup and click cancel in Report view reopens EditAttribuionPopup', () => {
    const { store } = renderComponentWithStore(<NotSavedPopup />);
    store.dispatch(navigateToView(View.Report));
    store.dispatch(
      openPopup(PopupType.EditAttributionPopup, 'test_selected_id'),
    );
    setupTestState(store, undefined, 'test_selected_id');

    expect(screen.getByText('There are unsaved changes.')).toBeInTheDocument();
    fireEvent.click(screen.queryByText(ButtonText.Cancel) as Element);
    expect(getOpenPopup(store.getState())).toBe(PopupType.EditAttributionPopup);
  });
});

describe('NotSavedPopup and change view', () => {
  it('renders a NotSavedPopup', () => {
    const { store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store, View.Attribution);

    expect(screen.getByText('Warning')).toBeInTheDocument();
    fireEvent.click(screen.queryByText(ButtonText.Save) as Element);
    expect(getOpenPopup(store.getState())).toBeFalsy();
    expect(getSelectedResourceId(store.getState())).toBe('test_id');
    expect(isAttributionViewSelected(store.getState())).toBe(true);
  });

  it('renders a NotSavedPopup and click cancel', () => {
    const { store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store, View.Attribution);

    expect(screen.getByText('Warning')).toBeInTheDocument();
    fireEvent.click(screen.queryByText('Cancel') as Element);
    expect(getOpenPopup(store.getState())).toBeFalsy();
    expect(getSelectedResourceId(store.getState())).toBe('');
    expect(isAuditViewSelected(store.getState())).toBe(true);
  });

  it('renders a NotSavedPopup and click reset', () => {
    const { store } = renderComponentWithStore(<NotSavedPopup />);
    setupTestState(store, View.Attribution);
    store.dispatch(
      setTemporaryDisplayPackageInfo({
        packageName: 'test name',
        attributionIds: [],
      }),
    );

    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual({
      packageName: 'test name',
      attributionIds: [],
    });

    fireEvent.click(screen.getByText(ButtonText.Discard));
    expect(getOpenPopup(store.getState())).toBeFalsy();
    expect(getSelectedResourceId(store.getState())).toBe('test_id');
    expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
      EMPTY_DISPLAY_PACKAGE_INFO,
    );
    expect(isAttributionViewSelected(store.getState())).toBe(true);
  });
});
