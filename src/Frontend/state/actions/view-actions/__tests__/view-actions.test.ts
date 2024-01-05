// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PopupType, View } from '../../../../enums/enums';
import { createAppStore } from '../../../configure-store';
import {
  getOpenPopup,
  getPopupAttributionId,
  getQAMode,
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
  setQAMode,
  setTargetView,
} from '../view-actions';

describe('view actions', () => {
  it('sets view to AuditView as initial value', () => {
    const testStore = createAppStore();
    expect(isAuditViewSelected(testStore.getState())).toBe(true);
    expect(isReportViewSelected(testStore.getState())).toBe(false);
    expect(isAttributionViewSelected(testStore.getState())).toBe(false);
  });

  it('sets view to AttributionView', () => {
    const testStore = createAppStore();
    testStore.dispatch(navigateToView(View.Attribution));

    expect(isAuditViewSelected(testStore.getState())).toBe(false);
    expect(isReportViewSelected(testStore.getState())).toBe(false);
    expect(isAttributionViewSelected(testStore.getState())).toBe(true);
  });

  it('sets view to ReportView', () => {
    const testStore = createAppStore();
    testStore.dispatch(navigateToView(View.Report));

    expect(isAuditViewSelected(testStore.getState())).toBe(false);
    expect(isAttributionViewSelected(testStore.getState())).toBe(false);
    expect(isReportViewSelected(testStore.getState())).toBe(true);
  });

  it('sets view to AttributionView and back to AuditView', () => {
    const testStore = createAppStore();
    testStore.dispatch(navigateToView(View.Attribution));

    expect(isAuditViewSelected(testStore.getState())).toBe(false);
    expect(isReportViewSelected(testStore.getState())).toBe(false);
    expect(isAttributionViewSelected(testStore.getState())).toBe(true);

    testStore.dispatch(navigateToView(View.Audit));

    expect(isAuditViewSelected(testStore.getState())).toBe(true);
    expect(isReportViewSelected(testStore.getState())).toBe(false);
    expect(isAttributionViewSelected(testStore.getState())).toBe(false);
  });

  it('sets view to AuditView even if it is already set', () => {
    const testStore = createAppStore();

    expect(isAuditViewSelected(testStore.getState())).toBe(true);
    expect(isReportViewSelected(testStore.getState())).toBe(false);
    expect(isAttributionViewSelected(testStore.getState())).toBe(false);

    testStore.dispatch(navigateToView(View.Audit));

    expect(isAuditViewSelected(testStore.getState())).toBe(true);
    expect(isReportViewSelected(testStore.getState())).toBe(false);
    expect(isAttributionViewSelected(testStore.getState())).toBe(false);
  });

  it('sets the selectedView', () => {
    const testStore = createAppStore();
    testStore.dispatch(navigateToView(View.Attribution));

    expect(getSelectedView(testStore.getState())).toBe(View.Attribution);

    testStore.dispatch(navigateToView(View.Audit));

    expect(getSelectedView(testStore.getState())).toBe(View.Audit);

    testStore.dispatch(navigateToView(View.Report));

    expect(getSelectedView(testStore.getState())).toBe(View.Report);
  });

  it('resets view state', () => {
    const testStore = createAppStore();
    testStore.dispatch(navigateToView(View.Attribution));
    testStore.dispatch(openPopup(PopupType.NotSavedPopup));
    testStore.dispatch(setTargetView(View.Audit));

    expect(isAttributionViewSelected(testStore.getState())).toBe(true);
    expect(getTargetView(testStore.getState())).toBe(View.Audit);
    expect(getOpenPopup(testStore.getState())).toBe(PopupType.NotSavedPopup);

    testStore.dispatch(resetViewState());
    expect(isAttributionViewSelected(testStore.getState())).toBe(false);
    expect(getTargetView(testStore.getState())).toBeNull();
    expect(getOpenPopup(testStore.getState())).toBeNull();
  });

  it('sets and gets QA mode state', () => {
    const testStore = createAppStore();
    expect(getQAMode(testStore.getState())).toBe(false);
    testStore.dispatch(setQAMode(true));
    expect(getQAMode(testStore.getState())).toBe(true);
    testStore.dispatch(setQAMode(false));
    expect(getQAMode(testStore.getState())).toBe(false);
  });
});

describe('popup actions', () => {
  it('popup is closed by default', () => {
    const testStore = createAppStore();
    expect(getOpenPopup(testStore.getState())).toBeFalsy();
  });

  it('open NotSavedPopup', () => {
    const testStore = createAppStore();
    testStore.dispatch(openPopup(PopupType.NotSavedPopup));
    expect(getOpenPopup(testStore.getState())).toBe(PopupType.NotSavedPopup);
  });

  it('close NotSavedPopup', () => {
    const testStore = createAppStore();
    testStore.dispatch(openPopup(PopupType.NotSavedPopup));
    testStore.dispatch(closePopup());
    expect(getOpenPopup(testStore.getState())).toBeFalsy();
  });
  it('sets targetAttributionId and popupType', () => {
    const testStore = createAppStore();
    expect(getPopupAttributionId(testStore.getState())).toBeNull();
    const testAttributionId = 'test';
    testStore.dispatch(
      openPopup(PopupType.ConfirmDeletionPopup, testAttributionId),
    );
    expect(getPopupAttributionId(testStore.getState())).toEqual(
      testAttributionId,
    );
    expect(getOpenPopup(testStore.getState())).toBe(
      PopupType.ConfirmDeletionPopup,
    );
  });

  it('handles multiple opened popups', () => {
    const testStore = createAppStore();
    const testAttributionId = 'test';
    testStore.dispatch(openPopup(PopupType.NotSavedPopup, testAttributionId));
    expect(getPopupAttributionId(testStore.getState())).toEqual(
      testAttributionId,
    );
    expect(getOpenPopup(testStore.getState())).toBe(PopupType.NotSavedPopup);

    testStore.dispatch(openPopup(PopupType.LocatorPopup));
    expect(getPopupAttributionId(testStore.getState())).toBeNull();
    expect(getOpenPopup(testStore.getState())).toBe(PopupType.LocatorPopup);

    testStore.dispatch(closePopup());
    expect(getPopupAttributionId(testStore.getState())).toEqual(
      testAttributionId,
    );
    expect(getOpenPopup(testStore.getState())).toBe(PopupType.NotSavedPopup);

    testStore.dispatch(closePopup());
    expect(getPopupAttributionId(testStore.getState())).toBeNull();
    expect(getOpenPopup(testStore.getState())).toBeNull();
  });

  it('opens each popup only once', () => {
    const testStore = createAppStore();
    expect(getOpenPopup(testStore.getState())).toBeNull();
    // open file search popup twice
    testStore.dispatch(openPopup(PopupType.FileSearchPopup));
    testStore.dispatch(openPopup(PopupType.FileSearchPopup));
    expect(getOpenPopup(testStore.getState())).toBe(PopupType.FileSearchPopup);

    // there should be only one search popup open
    testStore.dispatch(closePopup());
    expect(getOpenPopup(testStore.getState())).toBeNull();
  });
});
