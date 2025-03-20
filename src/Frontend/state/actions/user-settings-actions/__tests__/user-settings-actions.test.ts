// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { waitFor } from '@testing-library/react';

import { DEFAULT_USER_SETTINGS } from '../../../../../shared/shared-constants';
import { faker } from '../../../../../testing/Faker';
import { createAppStore } from '../../../configure-store';
import {
  getAreHiddenSignalsVisible,
  getPanelSizes,
  getQaMode,
  getShowClassifications,
} from '../../../selectors/user-settings-selector';
import {
  fetchUserSettings,
  setUserSetting,
  toggleAreHiddenSignalsVisible,
  updatePanelSizes,
  updateUserSettings,
} from '../user-settings-actions';

describe('user-settings-actions', () => {
  it('sets the users setting', () => {
    const store = createAppStore();

    store.dispatch(
      setUserSetting({ qaMode: true, showClassifications: false }),
    );

    expect(getQaMode(store.getState())).toBe(true);
    expect(getShowClassifications(store.getState())).toBe(false);

    store.dispatch(setUserSetting({ qaMode: false }));
    expect(getQaMode(store.getState())).toBe(false);
    expect(getShowClassifications(store.getState())).toBe(false);
  });

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
      expect(getQaMode(store.getState())).toBe(true);
    });
  });

  it('updates user settings and communicates to the backend', async () => {
    const store = createAppStore();
    const backendCall = jest.mocked(window.electronAPI.setUserSettings);

    const userSettings = { showClassifications: false };
    store.dispatch(updateUserSettings(userSettings));

    await waitFor(() => {
      expect(getShowClassifications(store.getState())).toBe(false);
    });
    expect(backendCall).toHaveBeenCalledWith(userSettings);
  });

  it('updates panel sizes', async () => {
    const store = createAppStore();
    const backendCall = jest.mocked(window.electronAPI.setUserSettings);

    const signalsPanelHeight = faker.number.int({ min: 1 });
    store.dispatch(updatePanelSizes({ signalsPanelHeight }));

    await waitFor(() => {
      const panelSizes = getPanelSizes(store.getState());
      expect(panelSizes.signalsPanelHeight).toBe(signalsPanelHeight);
    });
    expect(backendCall).toHaveBeenCalled();
  });

  it('toggles hidden signals', async () => {
    const store = createAppStore();
    const hiddenSignalsVisibleAtStart = getAreHiddenSignalsVisible(
      store.getState(),
    );

    toggleAreHiddenSignalsVisible(store.dispatch);

    await waitFor(() =>
      expect(getAreHiddenSignalsVisible(store.getState())).toBe(
        !hiddenSignalsVisibleAtStart,
      ),
    );

    toggleAreHiddenSignalsVisible(store.dispatch);

    await waitFor(() =>
      expect(getAreHiddenSignalsVisible(store.getState())).toBe(
        hiddenSignalsVisibleAtStart,
      ),
    );
  });
});
