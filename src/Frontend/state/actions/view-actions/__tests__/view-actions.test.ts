// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_USER_SETTINGS } from '../../../../../shared/shared-constants';
import type { UserSettings } from '../../../../../shared/shared-types';
import { PopupType, View } from '../../../../enums/enums';
import { createAppStore } from '../../../configure-store';
import {
  getOpenPopup,
  getPopupAttributionId,
  getSelectedView,
  getTargetView,
  isAuditViewSelected,
  isReportViewSelected,
} from '../../../selectors/view-selector';
import {
  closePopup,
  navigateToView,
  openPopup,
  openStatisticsPopupAfterFileLoadIfEnabled,
  resetViewState,
  setTargetView,
} from '../view-actions';

describe('view actions', () => {
  it('sets view to audit view', () => {
    const testStore = createAppStore();
    testStore.dispatch(navigateToView(View.Audit));

    expect(isReportViewSelected(testStore.getState())).toBe(false);
    expect(isAuditViewSelected(testStore.getState())).toBe(true);
  });

  it('sets view to report view', () => {
    const testStore = createAppStore();
    testStore.dispatch(navigateToView(View.Report));

    expect(isAuditViewSelected(testStore.getState())).toBe(false);
    expect(isReportViewSelected(testStore.getState())).toBe(true);
  });

  it('sets the selectedView', () => {
    const testStore = createAppStore();
    testStore.dispatch(navigateToView(View.Audit));

    expect(getSelectedView(testStore.getState())).toBe(View.Audit);

    testStore.dispatch(navigateToView(View.Report));

    expect(getSelectedView(testStore.getState())).toBe(View.Report);
  });

  it('resets view state', () => {
    const testStore = createAppStore();
    testStore.dispatch(navigateToView(View.Report));
    testStore.dispatch(openPopup(PopupType.NotSavedPopup));
    testStore.dispatch(setTargetView(View.Report));

    expect(isAuditViewSelected(testStore.getState())).toBe(false);
    expect(getTargetView(testStore.getState())).toBe(View.Report);
    expect(getOpenPopup(testStore.getState())?.popup).toBe(
      PopupType.NotSavedPopup,
    );

    testStore.dispatch(resetViewState());
    expect(isAuditViewSelected(testStore.getState())).toBe(true);
    expect(getTargetView(testStore.getState())).toBeNull();
    expect(getOpenPopup(testStore.getState())).toBeNull();
  });
});

describe('popup actions', () => {
  it('waits for persisted user settings before deciding to show statistics', async () => {
    const testStore = createAppStore();
    let resolveSettings: ((settings: UserSettings) => void) | undefined;
    vi.mocked(window.electronAPI.getUserSettings).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSettings = resolve;
      }),
    );

    const openStatistics = testStore.dispatch(
      openStatisticsPopupAfterFileLoadIfEnabled,
    );
    expect(getOpenPopup(testStore.getState())).toBeNull();

    resolveSettings?.({
      ...DEFAULT_USER_SETTINGS,
      showProjectStatistics: true,
    });
    await openStatistics;

    expect(getOpenPopup(testStore.getState())?.popup).toBe(
      PopupType.ProjectStatisticsPopup,
    );
  });

  it('logs and skips statistics when persisted settings cannot be loaded', async () => {
    const testStore = createAppStore();
    const error = new Error('settings unavailable');
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    vi.mocked(window.electronAPI.getUserSettings).mockRejectedValueOnce(error);

    await expect(
      testStore.dispatch(openStatisticsPopupAfterFileLoadIfEnabled),
    ).resolves.toBeUndefined();

    expect(consoleError).toHaveBeenCalledWith(
      'Could not load user settings for project statistics',
      error,
    );
    expect(getOpenPopup(testStore.getState())).toBeNull();
    consoleError.mockRestore();
  });

  it('popup is closed by default', () => {
    const testStore = createAppStore();
    expect(getOpenPopup(testStore.getState())).toBeFalsy();
  });

  it('open NotSavedPopup', () => {
    const testStore = createAppStore();
    testStore.dispatch(openPopup(PopupType.NotSavedPopup));
    expect(getOpenPopup(testStore.getState())?.popup).toBe(
      PopupType.NotSavedPopup,
    );
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
    testStore.dispatch(openPopup(PopupType.NotSavedPopup, testAttributionId));
    expect(getPopupAttributionId(testStore.getState())).toEqual(
      testAttributionId,
    );
    expect(getOpenPopup(testStore.getState())?.popup).toBe(
      PopupType.NotSavedPopup,
    );
  });

  it('handles multiple opened popups', () => {
    const testStore = createAppStore();
    const testAttributionId = 'test';
    testStore.dispatch(openPopup(PopupType.NotSavedPopup, testAttributionId));
    expect(getPopupAttributionId(testStore.getState())).toEqual(
      testAttributionId,
    );
    expect(getOpenPopup(testStore.getState())?.popup).toBe(
      PopupType.NotSavedPopup,
    );

    testStore.dispatch(openPopup(PopupType.ProjectMetadataPopup));
    expect(getPopupAttributionId(testStore.getState())).toBeNull();
    expect(getOpenPopup(testStore.getState())?.popup).toBe(
      PopupType.ProjectMetadataPopup,
    );

    testStore.dispatch(closePopup());
    expect(getPopupAttributionId(testStore.getState())).toEqual(
      testAttributionId,
    );
    expect(getOpenPopup(testStore.getState())?.popup).toBe(
      PopupType.NotSavedPopup,
    );

    testStore.dispatch(closePopup());
    expect(getPopupAttributionId(testStore.getState())).toBeNull();
    expect(getOpenPopup(testStore.getState())).toBeNull();
  });

  it('opens each popup only once', () => {
    const testStore = createAppStore();
    expect(getOpenPopup(testStore.getState())).toBeNull();
    // open file search popup twice
    testStore.dispatch(openPopup(PopupType.NotSavedPopup));
    testStore.dispatch(openPopup(PopupType.NotSavedPopup));
    expect(getOpenPopup(testStore.getState())?.popup).toBe(
      PopupType.NotSavedPopup,
    );

    // there should be only one search popup open
    testStore.dispatch(closePopup());
    expect(getOpenPopup(testStore.getState())).toBeNull();
  });
});
