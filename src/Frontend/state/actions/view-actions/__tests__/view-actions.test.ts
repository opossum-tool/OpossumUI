// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { FilterType, PopupType, View } from '../../../../enums/enums';
import { createTestAppStore } from '../../../../test-helpers/render-component-with-store';
import {
  getActiveFilters,
  getOpenPopup,
  getPopupAttributionId,
  getSelectedView,
  getTargetView,
  isAttributionViewSelected,
  isAuditViewSelected,
  isReportViewSelected,
} from '../../../selectors/view-selector';
import {
  closePopup,
  navigateToView,
  openPopup,
  resetViewState,
  setTargetView,
  updateActiveFilters,
} from '../view-actions';

describe('view actions', () => {
  test('sets view to AuditView as initial value', () => {
    const testStore = createTestAppStore();
    expect(isAuditViewSelected(testStore.getState())).toBe(true);
    expect(isReportViewSelected(testStore.getState())).toBe(false);
    expect(isAttributionViewSelected(testStore.getState())).toBe(false);
  });

  test('sets view to AttributionView', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(navigateToView(View.Attribution));

    expect(isAuditViewSelected(testStore.getState())).toBe(false);
    expect(isReportViewSelected(testStore.getState())).toBe(false);
    expect(isAttributionViewSelected(testStore.getState())).toBe(true);
  });

  test('sets view to ReportView', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(navigateToView(View.Report));

    expect(isAuditViewSelected(testStore.getState())).toBe(false);
    expect(isAttributionViewSelected(testStore.getState())).toBe(false);
    expect(isReportViewSelected(testStore.getState())).toBe(true);
  });

  test('sets view to AttributionView and back to AuditView', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(navigateToView(View.Attribution));

    expect(isAuditViewSelected(testStore.getState())).toBe(false);
    expect(isReportViewSelected(testStore.getState())).toBe(false);
    expect(isAttributionViewSelected(testStore.getState())).toBe(true);

    testStore.dispatch(navigateToView(View.Audit));

    expect(isAuditViewSelected(testStore.getState())).toBe(true);
    expect(isReportViewSelected(testStore.getState())).toBe(false);
    expect(isAttributionViewSelected(testStore.getState())).toBe(false);
  });

  test('sets view to AuditView even if it is already set', () => {
    const testStore = createTestAppStore();

    expect(isAuditViewSelected(testStore.getState())).toBe(true);
    expect(isReportViewSelected(testStore.getState())).toBe(false);
    expect(isAttributionViewSelected(testStore.getState())).toBe(false);

    testStore.dispatch(navigateToView(View.Audit));

    expect(isAuditViewSelected(testStore.getState())).toBe(true);
    expect(isReportViewSelected(testStore.getState())).toBe(false);
    expect(isAttributionViewSelected(testStore.getState())).toBe(false);
  });

  test('sets the selectedView', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(navigateToView(View.Attribution));

    expect(getSelectedView(testStore.getState())).toBe(View.Attribution);

    testStore.dispatch(navigateToView(View.Audit));

    expect(getSelectedView(testStore.getState())).toBe(View.Audit);

    testStore.dispatch(navigateToView(View.Report));

    expect(getSelectedView(testStore.getState())).toBe(View.Report);
  });

  test('resets view state', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(navigateToView(View.Attribution));
    testStore.dispatch(openPopup(PopupType.NotSavedPopup));
    testStore.dispatch(setTargetView(View.Audit));
    testStore.dispatch(updateActiveFilters(FilterType.OnlyFollowUp));

    expect(isAttributionViewSelected(testStore.getState())).toBe(true);
    expect(getTargetView(testStore.getState())).toBe(View.Audit);
    expect(getOpenPopup(testStore.getState())).toBe(PopupType.NotSavedPopup);
    expect(
      getActiveFilters(testStore.getState()).has(FilterType.OnlyFollowUp)
    ).toBe(true);

    testStore.dispatch(resetViewState());
    expect(isAttributionViewSelected(testStore.getState())).toBe(false);
    expect(getTargetView(testStore.getState())).toBe(null);
    expect(getOpenPopup(testStore.getState())).toBe(null);
    expect(
      getActiveFilters(testStore.getState()).has(FilterType.OnlyFollowUp)
    ).toBe(false);
  });

  test('sets filters correctly', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(updateActiveFilters(FilterType.OnlyFirstParty));
    expect(
      getActiveFilters(testStore.getState()).has(FilterType.OnlyFirstParty)
    ).toBe(true);

    testStore.dispatch(updateActiveFilters(FilterType.OnlyFirstParty));
    expect(
      getActiveFilters(testStore.getState()).has(FilterType.OnlyFirstParty)
    ).toBe(false);

    testStore.dispatch(updateActiveFilters(FilterType.OnlyFirstParty));
    testStore.dispatch(updateActiveFilters(FilterType.HideFirstParty));
    expect(
      getActiveFilters(testStore.getState()).has(FilterType.OnlyFirstParty)
    ).toBe(false);
    expect(
      getActiveFilters(testStore.getState()).has(FilterType.HideFirstParty)
    ).toBe(true);

    testStore.dispatch(updateActiveFilters(FilterType.OnlyFirstParty));
    testStore.dispatch(updateActiveFilters(FilterType.OnlyFollowUp));
    expect(
      getActiveFilters(testStore.getState()).has(FilterType.OnlyFirstParty)
    ).toBe(true);
    expect(
      getActiveFilters(testStore.getState()).has(FilterType.OnlyFollowUp)
    ).toBe(true);
  });
});

describe('popup actions', () => {
  test('popup is closed by default', () => {
    const testStore = createTestAppStore();
    expect(getOpenPopup(testStore.getState())).toBeFalsy();
  });

  test('open NotSavedPopup', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(openPopup(PopupType.NotSavedPopup));
    expect(getOpenPopup(testStore.getState())).toBe(PopupType.NotSavedPopup);
  });

  test('close NotSavedPopup', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(openPopup(PopupType.NotSavedPopup));
    testStore.dispatch(closePopup());
    expect(getOpenPopup(testStore.getState())).toBeFalsy();
  });
  test('sets targetAttributionId and popupType', () => {
    const testStore = createTestAppStore();
    expect(getPopupAttributionId(testStore.getState())).toEqual(null);
    const testAttributionId = 'test';
    testStore.dispatch(
      openPopup(PopupType.ConfirmDeletionPopup, testAttributionId)
    );
    expect(getPopupAttributionId(testStore.getState())).toEqual(
      testAttributionId
    );
    expect(getOpenPopup(testStore.getState())).toBe(
      PopupType.ConfirmDeletionPopup
    );
  });

  test('handles multiple opened popups', () => {
    const testStore = createTestAppStore();
    const testAttributionId = 'test';
    testStore.dispatch(
      openPopup(PopupType.EditAttributionPopup, testAttributionId)
    );
    expect(getPopupAttributionId(testStore.getState())).toEqual(
      testAttributionId
    );
    expect(getOpenPopup(testStore.getState())).toBe(
      PopupType.EditAttributionPopup
    );

    testStore.dispatch(openPopup(PopupType.PackageSearchPopup));
    expect(getPopupAttributionId(testStore.getState())).toBeNull();
    expect(getOpenPopup(testStore.getState())).toBe(
      PopupType.PackageSearchPopup
    );

    testStore.dispatch(closePopup());
    expect(getPopupAttributionId(testStore.getState())).toEqual(
      testAttributionId
    );
    expect(getOpenPopup(testStore.getState())).toBe(
      PopupType.EditAttributionPopup
    );

    testStore.dispatch(closePopup());
    expect(getPopupAttributionId(testStore.getState())).toBeNull();
    expect(getOpenPopup(testStore.getState())).toBeNull();
  });
});
