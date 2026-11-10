// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_USER_SETTINGS } from '../../../../../shared/shared-constants';
import type { UserSettings } from '../../../../../shared/shared-types';
import { createAppStore } from '../../../configure-store';
import { getUserSettingsLoaded } from '../../../selectors/user-settings-selector';
import {
  fetchUserSettings,
  setUserSetting,
  updateUserSettings,
} from '../user-settings-actions';

describe('user-settings-actions', () => {
  it('marks settings ready only after persisted values have loaded', async () => {
    const store = createAppStore();
    const { promise, resolve } = Promise.withResolvers<UserSettings>();
    vi.mocked(window.electronAPI.getUserSettings).mockReturnValue(promise);

    const loading = store.dispatch(fetchUserSettings());
    expect(getUserSettingsLoaded(store.getState())).toBe(false);
    expect(store.getState().userSettingsState.qaMode).toBe(false);

    resolve({ ...DEFAULT_USER_SETTINGS, qaMode: true });
    await loading;
    expect(getUserSettingsLoaded(store.getState())).toBe(true);
    expect(store.getState().userSettingsState.qaMode).toBe(true);
  });

  it('does not treat a partial settings update as completed initialization', () => {
    const store = createAppStore();
    store.dispatch(setUserSetting({ qaMode: true }));
    expect(store.getState().userSettingsState.qaMode).toBe(true);
    expect(getUserSettingsLoaded(store.getState())).toBe(false);
  });

  it('leaves settings uninitialized when the initial read fails', async () => {
    const store = createAppStore();
    const error = new Error('settings unavailable');
    vi.mocked(window.electronAPI.getUserSettings).mockRejectedValue(error);
    await expect(store.dispatch(fetchUserSettings())).rejects.toBe(error);
    expect(getUserSettingsLoaded(store.getState())).toBe(false);
    expect(store.getState().userSettingsState).toEqual(DEFAULT_USER_SETTINGS);
  });

  it('updates shared state only after settings are successfully persisted', async () => {
    const store = createAppStore();
    const { promise, resolve } = Promise.withResolvers<void>();
    vi.mocked(window.electronAPI.updateUserSettings).mockReturnValue(promise);
    const saving = store.dispatch(updateUserSettings({ qaMode: true }));
    expect(window.electronAPI.updateUserSettings).toHaveBeenCalledWith({
      qaMode: true,
    });
    expect(store.getState().userSettingsState.qaMode).toBe(false);
    resolve();
    await saving;
    expect(store.getState().userSettingsState.qaMode).toBe(true);
    expect(getUserSettingsLoaded(store.getState())).toBe(false);
  });

  it('preserves shared settings when persistence fails', async () => {
    const store = createAppStore();
    const error = new Error('settings are read-only');
    vi.mocked(window.electronAPI.updateUserSettings).mockRejectedValue(error);
    await expect(
      store.dispatch(updateUserSettings({ qaMode: true })),
    ).rejects.toBe(error);
    expect(store.getState().userSettingsState.qaMode).toBe(false);
  });
});
