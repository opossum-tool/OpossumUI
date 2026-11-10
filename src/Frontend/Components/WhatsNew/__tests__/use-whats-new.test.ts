// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, renderHook, waitFor } from '@testing-library/react';

import { DEFAULT_USER_SETTINGS } from '../../../../shared/shared-constants';
import type { UserSettings } from '../../../../shared/shared-types';
import { PopupType } from '../../../enums/enums';
import { fetchUserSettings } from '../../../state/actions/user-settings-actions/user-settings-actions';
import { ACTION_OPEN_POPUP } from '../../../state/actions/view-actions/types';
import {
  closePopup,
  openPopup,
} from '../../../state/actions/view-actions/view-actions';
import type { Action } from '../../../state/configure-store';
import { useAppSelector } from '../../../state/hooks';
import { getUserSettingsLoaded } from '../../../state/selectors/user-settings-selector';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import { useInitUserSettings } from '../../../state/variables/use-user-setting';
import {
  createTestStore,
  makeProviderWrapper,
  makeReactQueryClient,
} from '../../../test-helpers/render';
import { useWhatsNew } from '../use-whats-new';

const notes = vi.hoisted(() => ({ revision: 1 }));

vi.mock('../../../whats-new/release-notes', () => ({
  get revision() {
    return notes.revision;
  },
}));

let savedSettings: UserSettings;

async function renderWhatsNew(actions: Array<Action> = []) {
  const store = await createTestStore();
  actions.forEach(store.dispatch);
  const dispatch = vi.spyOn(store, 'dispatch');
  const queryClient = makeReactQueryClient();
  const view = renderHook(
    () => {
      useInitUserSettings();
      useWhatsNew();
      return useAppSelector(getUserSettingsLoaded);
    },
    {
      wrapper: makeProviderWrapper(store, queryClient),
    },
  );
  return { ...view, store, dispatch };
}

describe('automatic release announcements', () => {
  beforeEach(() => {
    vi.stubEnv('PROD', true);
    notes.revision = 1;
    savedSettings = { ...DEFAULT_USER_SETTINGS };
    vi.mocked(window.electronAPI.getUserSettings).mockImplementation(() =>
      Promise.resolve({ ...savedSettings }),
    );
    vi.mocked(window.electronAPI.updateUserSettings).mockImplementation(
      (settings) => {
        savedSettings = { ...savedSettings, ...settings };
        return Promise.resolve();
      },
    );
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each([
    { saved: 0, current: 1 },
    { saved: 1, current: 2 },
    { saved: 1, current: 4 },
  ])(
    'opens unseen notes (saved $saved, current $current)',
    async ({ saved, current }) => {
      savedSettings.lastSeenWhatsNewRevision = saved;
      notes.revision = current;
      const { store, dispatch } = await renderWhatsNew();

      await waitFor(() =>
        expect(getOpenPopup(store.getState())?.popup).toBe(
          PopupType.WhatsNewPopup,
        ),
      );
      expect(dispatch).toHaveBeenCalledWith(openPopup(PopupType.WhatsNewPopup));
      await waitFor(() =>
        expect(savedSettings.lastSeenWhatsNewRevision).toBe(current),
      );
      expect(store.getState().userSettingsState.lastSeenWhatsNewRevision).toBe(
        current,
      );
      expect(getUserSettingsLoaded(store.getState())).toBe(true);
      expect(window.electronAPI.getUserSettings).toHaveBeenCalledTimes(1);
    },
  );

  it.each([1, 2])(
    'does not automatically open notes already seen at revision %s',
    async (saved) => {
      savedSettings.lastSeenWhatsNewRevision = saved;
      const { store, dispatch, result } = await renderWhatsNew();
      await waitFor(() => expect(result.current).toBe(true));
      expect(getOpenPopup(store.getState())).toBeNull();
      expect(dispatch).not.toHaveBeenCalledWith(
        openPopup(PopupType.WhatsNewPopup),
      );
      expect(window.electronAPI.updateUserSettings).not.toHaveBeenCalled();
    },
  );

  it('does not show an announcement again across a restart or bugfix update', async () => {
    const { unmount } = await renderWhatsNew();
    await waitFor(() => expect(savedSettings.lastSeenWhatsNewRevision).toBe(1));
    unmount();

    const { store, result } = await renderWhatsNew();
    await waitFor(() => expect(result.current).toBe(true));
    expect(getOpenPopup(store.getState())).toBeNull();
    expect(window.electronAPI.updateUserSettings).toHaveBeenCalledTimes(1);
  });

  it.each([
    { saved: 0, expectedPopup: PopupType.WhatsNewPopup, expectedWrites: 1 },
    { saved: 1, expectedPopup: null, expectedWrites: 0 },
  ])(
    'waits for delayed persisted settings (seen revision $saved)',
    async ({ saved, expectedPopup, expectedWrites }) => {
      const { promise, resolve } = Promise.withResolvers<UserSettings>();
      vi.mocked(window.electronAPI.getUserSettings).mockReturnValue(promise);
      const { store, result } = await renderWhatsNew();
      expect(result.current).toBe(false);
      expect(getOpenPopup(store.getState())).toBeNull();
      expect(window.electronAPI.updateUserSettings).not.toHaveBeenCalled();

      act(() => resolve({ ...savedSettings, lastSeenWhatsNewRevision: saved }));
      await waitFor(() => expect(result.current).toBe(true));
      await waitFor(() =>
        expect(getOpenPopup(store.getState())?.popup ?? null).toBe(
          expectedPopup,
        ),
      );
      await waitFor(() =>
        expect(window.electronAPI.updateUserSettings).toHaveBeenCalledTimes(
          expectedWrites,
        ),
      );
    },
  );

  it('does not open or consume revision zero', async () => {
    notes.revision = 0;
    const { store } = await renderWhatsNew();
    expect(getOpenPopup(store.getState())).toBeNull();
    expect(window.electronAPI.getUserSettings).toHaveBeenCalledTimes(1);
    act(() => {
      store.dispatch(openPopup(PopupType.WhatsNewPopup));
    });
    expect(window.electronAPI.updateUserSettings).not.toHaveBeenCalled();
  });

  it('does not automatically open in development', async () => {
    vi.stubEnv('PROD', false);
    const { store, result } = await renderWhatsNew();
    await waitFor(() => expect(result.current).toBe(true));
    expect(getOpenPopup(store.getState())).toBeNull();
    expect(window.electronAPI.updateUserSettings).not.toHaveBeenCalled();
  });

  it('does not automatically open when reading settings fails', async () => {
    const error = new Error('settings unavailable');
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(window.electronAPI.getUserSettings).mockRejectedValue(error);
    const { store, result } = await renderWhatsNew();
    await waitFor(() =>
      expect(logError).toHaveBeenCalledWith(
        'Could not load user settings.',
        error,
      ),
    );
    expect(result.current).toBe(false);
    expect(getOpenPopup(store.getState())).toBeNull();
    expect(window.electronAPI.updateUserSettings).not.toHaveBeenCalled();
  });

  it('does not retrigger on dismissal, rerenders, or refetches while saving is pending', async () => {
    const { promise, resolve } = Promise.withResolvers<void>();
    vi.mocked(window.electronAPI.updateUserSettings).mockReturnValue(promise);
    const { store, rerender, dispatch } = await renderWhatsNew();
    await waitFor(() =>
      expect(getOpenPopup(store.getState())?.popup).toBe(
        PopupType.WhatsNewPopup,
      ),
    );
    await waitFor(() =>
      expect(window.electronAPI.updateUserSettings).toHaveBeenCalledTimes(1),
    );
    act(() => {
      store.dispatch(closePopup());
    });
    rerender();
    await act(async () => {
      await store.dispatch(fetchUserSettings());
    });
    expect(getOpenPopup(store.getState())).toBeNull();
    expect(
      dispatch.mock.calls.filter(
        ([action]) =>
          typeof action !== 'function' && action.type === ACTION_OPEN_POPUP,
      ),
    ).toHaveLength(1);
    expect(window.electronAPI.updateUserSettings).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve();
      await promise;
    });
    expect(getOpenPopup(store.getState())).toBeNull();
  });

  it('remembers a manual opening before settings resolve without automatically reopening', async () => {
    const { promise, resolve } = Promise.withResolvers<UserSettings>();
    vi.mocked(window.electronAPI.getUserSettings).mockReturnValue(promise);
    const { store, dispatch } = await renderWhatsNew();
    act(() => {
      store.dispatch(openPopup(PopupType.WhatsNewPopup));
    });
    act(() => {
      store.dispatch(closePopup());
    });
    act(() => resolve(savedSettings));
    await waitFor(() => expect(savedSettings.lastSeenWhatsNewRevision).toBe(1));
    expect(getOpenPopup(store.getState())).toBeNull();
    expect(
      dispatch.mock.calls.filter(
        ([action]) =>
          typeof action !== 'function' && action.type === ACTION_OPEN_POPUP,
      ),
    ).toHaveLength(1);
  });

  it('preserves a newer saved revision when older notes are opened manually', async () => {
    savedSettings.lastSeenWhatsNewRevision = 2;
    const { store, result } = await renderWhatsNew();
    await waitFor(() => expect(result.current).toBe(true));
    act(() => {
      store.dispatch(openPopup(PopupType.WhatsNewPopup));
    });
    expect(window.electronAPI.updateUserSettings).not.toHaveBeenCalled();
    expect(savedSettings.lastSeenWhatsNewRevision).toBe(2);
  });

  it('retries on a later launch when saving the seen revision fails', async () => {
    const error = new Error('settings could not be saved');
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(window.electronAPI.updateUserSettings).mockRejectedValueOnce(
      error,
    );
    const { store, unmount } = await renderWhatsNew();
    await waitFor(() =>
      expect(logError).toHaveBeenCalledWith(
        'Could not remember the displayed release notes.',
        error,
      ),
    );
    expect(savedSettings.lastSeenWhatsNewRevision).toBe(0);
    expect(store.getState().userSettingsState.lastSeenWhatsNewRevision).toBe(0);
    unmount();

    const { store: restartedStore } = await renderWhatsNew();
    await waitFor(() =>
      expect(getOpenPopup(restartedStore.getState())?.popup).toBe(
        PopupType.WhatsNewPopup,
      ),
    );
    await waitFor(() => expect(savedSettings.lastSeenWhatsNewRevision).toBe(1));
  });

  it.each([
    PopupType.ProjectMetadataPopup,
    PopupType.ProjectStatisticsPopup,
  ] as const)(
    'does not skip the announcement because %s is already selected',
    async (popup) => {
      const { store } = await renderWhatsNew([openPopup(popup)]);
      await waitFor(() =>
        expect(getOpenPopup(store.getState())?.popup).toBe(
          PopupType.WhatsNewPopup,
        ),
      );
    },
  );
});
