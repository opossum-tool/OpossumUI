// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { waitFor } from '@testing-library/react';

import { DEFAULT_USER_SETTINGS } from '../../../../../shared/shared-constants';
import { createAppStore } from '../../../configure-store';
import {
  fetchUserSettings,
  updateUserSettings,
} from '../user-settings-actions';

describe('user-settings-actions', () => {
  it('loads the user settings from the backend', async () => {
    const store = createAppStore();
    const backendCall = jest.mocked(window.electronAPI.getUserSettings);
    backendCall.mockReturnValue(
      Promise.resolve({
        ...DEFAULT_USER_SETTINGS,
        qaMode: true,
      }),
    );

    store.dispatch(fetchUserSettings());

    await waitFor(() => {
      expect(store.getState().userSettingsState?.qaMode).toBe(true);
    });
  });

  it('updates user settings and communicates to the backend', async () => {
    const store = createAppStore();
    const backendCall = jest.mocked(window.electronAPI.setUserSettings);

    const userSettings = { showClassifications: false };
    store.dispatch(updateUserSettings(userSettings));

    await waitFor(() => {
      expect(store.getState().userSettingsState?.showClassifications).toBe(
        false,
      );
    });
    expect(backendCall).toHaveBeenCalledWith(userSettings);
  });
});
