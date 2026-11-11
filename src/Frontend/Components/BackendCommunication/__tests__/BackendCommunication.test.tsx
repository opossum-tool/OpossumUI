// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, waitFor } from '@testing-library/react';
import type { IpcRendererEvent } from 'electron';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import { DEFAULT_USER_SETTINGS } from '../../../../shared/shared-constants';
import { faker } from '../../../../testing/Faker';
import { PopupType } from '../../../enums/enums';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { fetchUserSettings } from '../../../state/actions/user-settings-actions/user-settings-actions';
import {
  closePopup,
  openPopup,
} from '../../../state/actions/view-actions/view-actions';
import {
  getSelectedResourceId,
  getTemporaryDisplayPackageInfo,
} from '../../../state/selectors/resource-selectors';
import { getUserSettingsLoaded } from '../../../state/selectors/user-settings-selector';
import {
  getOpenFileRequest,
  getOpenPopup,
  getOpenPopups,
} from '../../../state/selectors/view-selector';
import { useInitUserSettings } from '../../../state/variables/use-user-setting';
import { renderComponent } from '../../../test-helpers/render';
import type * as Environment from '../../../util/environment';
import { revision } from '../../../whats-new/release-notes';
import { GlobalPopup } from '../../GlobalPopup/GlobalPopup';
import { BackendCommunication } from '../BackendCommunication';

vi.mock('../../../util/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof Environment>();
  return { ...actual, isProductionOrAutomatedRun: () => true };
});

function InitializeUserSettings() {
  useInitUserSettings();
  return null;
}

describe('BackendCommunication', () => {
  it('stores the external file path in the unsaved-changes flow', async () => {
    const listeners = setupListeners();

    vi.mocked(window.electronAPI.on).mockImplementation((channel, listener) => {
      listeners.set(channel, [
        listener as (event: IpcRendererEvent, ...args: Array<unknown>) => void,
      ]);
      return vi.fn();
    });

    const { store } = await renderComponent(<BackendCommunication />, {
      actions: [setTemporaryDisplayPackageInfo(faker.opossum.packageInfo())],
    });
    const filePath = '/path/to/project.opossum';

    emit(listeners, AllowedFrontendChannels.OpenFile, filePath);

    expect(getOpenPopup(store.getState())?.popup).toBe(PopupType.NotSavedPopup);
    expect(getOpenFileRequest(store.getState())).toEqual({
      kind: 'path',
      filePath,
    });
  });

  function setupListeners(): Map<
    AllowedFrontendChannels,
    Array<(event: IpcRendererEvent, ...args: Array<unknown>) => void>
  > {
    const listeners = new Map<
      AllowedFrontendChannels,
      Array<(event: IpcRendererEvent, ...args: Array<unknown>) => void>
    >();
    vi.mocked(window.electronAPI.on).mockImplementation((channel, listener) => {
      const channelListeners = listeners.get(channel) ?? [];
      channelListeners.push(
        listener as (event: IpcRendererEvent, ...args: Array<unknown>) => void,
      );
      listeners.set(channel, channelListeners);
      return vi.fn();
    });
    return listeners;
  }

  function emit(
    listeners: ReturnType<typeof setupListeners>,
    channel: AllowedFrontendChannels,
    ...args: Array<unknown>
  ): void {
    listeners
      .get(channel)
      ?.forEach((listener) => listener({} as IpcRendererEvent, ...args));
  }

  describe('ProjectOpened', () => {
    it('lets startup notes take precedence when settings and load completion resolve together', async () => {
      const listeners = setupListeners();
      let resolveSettings:
        ((settings: typeof DEFAULT_USER_SETTINGS) => void) | undefined;
      vi.mocked(window.electronAPI.getUserSettings).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSettings = resolve;
        }),
      );
      const { store } = await renderComponent(
        <>
          <InitializeUserSettings />
          <BackendCommunication />
          <GlobalPopup />
        </>,
      );

      act(() => {
        emit(listeners, AllowedFrontendChannels.ProjectOpened);
      });
      resolveSettings?.({
        ...DEFAULT_USER_SETTINGS,
        showProjectStatistics: true,
        lastSeenWhatsNewRevision: revision - 1,
      });

      await waitFor(() =>
        expect(getOpenPopup(store.getState())?.popup).toBe(
          PopupType.WhatsNewPopup,
        ),
      );
      expect(
        getOpenPopups(store.getState()).some(
          ({ info }) => info.popup === PopupType.ProjectStatisticsPopup,
        ),
      ).toBe(false);

      act(() => {
        const notes = getOpenPopups(store.getState()).find(
          ({ info }) => info.popup === PopupType.WhatsNewPopup,
        );
        if (notes) {
          store.dispatch(closePopup(notes.id));
        }
      });
      await waitFor(() =>
        expect(getOpenPopup(store.getState())?.popup).toBe(
          PopupType.ProjectStatisticsPopup,
        ),
      );
    });

    it.each([true, false])(
      'wires ProjectOpened to the statistics request using loaded settings (%s)',
      async (showProjectStatistics) => {
        const listeners = setupListeners();
        vi.mocked(window.electronAPI.getUserSettings).mockResolvedValue({
          ...DEFAULT_USER_SETTINGS,
          showProjectStatistics,
          lastSeenWhatsNewRevision: revision,
        });
        const { store } = await renderComponent(
          <>
            <BackendCommunication />
            <GlobalPopup />
          </>,
        );
        await act(async () => {
          await store.dispatch(fetchUserSettings());
        });

        expect(getOpenPopup(store.getState())).toBeNull();
        expect(listeners.has(AllowedFrontendChannels.ProjectOpened)).toBe(true);

        act(() => {
          emit(listeners, AllowedFrontendChannels.ProjectOpened);
        });

        await waitFor(() =>
          expect(getUserSettingsLoaded(store.getState())).toBe(true),
        );
        expect(window.electronAPI.getUserSettings).toHaveBeenCalledOnce();
        expect(getOpenPopup(store.getState())).toEqual(
          showProjectStatistics
            ? { popup: PopupType.ProjectStatisticsPopup }
            : null,
        );
      },
    );

    it('cancels a pending request when the database resets', async () => {
      const listeners = setupListeners();
      vi.mocked(window.electronAPI.getUserSettings).mockResolvedValue({
        ...DEFAULT_USER_SETTINGS,
        showProjectStatistics: true,
        lastSeenWhatsNewRevision: revision,
      });
      const { store } = await renderComponent(<BackendCommunication />, {
        actions: [openPopup(PopupType.WhatsNewPopup)],
      });
      await act(async () => {
        await store.dispatch(fetchUserSettings());
      });

      act(() => {
        emit(listeners, AllowedFrontendChannels.ProjectOpened);
        emit(listeners, AllowedFrontendChannels.SetDatabaseInitialized, false);
      });
      act(() => {
        const notes = getOpenPopups(store.getState()).find(
          ({ info }) => info.popup === PopupType.WhatsNewPopup,
        );
        if (notes) {
          store.dispatch(closePopup(notes.id));
        }
      });

      await waitFor(() =>
        expect(getOpenPopups(store.getState())).toHaveLength(0),
      );
      expect(
        window.electronAPI.setFrontendDialogState,
      ).not.toHaveBeenCalledWith({
        anyDialogOpen: false,
        activityActive: true,
      });
    });
  });

  describe('SetDatabaseInitialized', () => {
    it('resets the resource state when the database is uninitialized', async () => {
      const listeners = setupListeners();
      const { store } = await renderComponent(<BackendCommunication />, {
        actions: [
          setTemporaryDisplayPackageInfo(faker.opossum.packageInfo()),
          setSelectedResourceId(
            '/some/resource/from/the/previous/file',
            'preserve',
          ),
        ],
      });

      act(() => {
        emit(listeners, AllowedFrontendChannels.SetDatabaseInitialized, false);
      });

      expect(getSelectedResourceId(store.getState())).toBe('/');
      expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
        EMPTY_DISPLAY_PACKAGE_INFO,
      );
    });

    it('keeps the resource state when the database is initialized', async () => {
      const listeners = setupListeners();
      const { store } = await renderComponent(<BackendCommunication />, {
        actions: [
          setSelectedResourceId('/some/resource/in/the/current/file', 'auto'),
        ],
      });

      act(() => {
        emit(listeners, AllowedFrontendChannels.SetDatabaseInitialized, true);
      });

      expect(getSelectedResourceId(store.getState())).toBe(
        '/some/resource/in/the/current/file',
      );
    });
  });
});
