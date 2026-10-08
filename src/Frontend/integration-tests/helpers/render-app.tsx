// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
import type { IpcRendererEvent } from 'electron';
import { Provider } from 'react-redux';
import { VirtuosoMockContext } from 'react-virtuoso';

import type { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { DEFAULT_USER_SETTINGS } from '../../../shared/shared-constants';
import type {
  ParsedFileContent,
  UserSettings,
} from '../../../shared/shared-types';
import { App } from '../../Components/App/App';
import { theme } from '../../Components/App/App.style';
import { Toaster } from '../../Components/Toaster/Toaster';
import { setUserSetting } from '../../state/actions/user-settings-actions/user-settings-actions';
import type { Action } from '../../state/configure-store';
import { createTestStore } from '../../test-helpers/render';

type IpcListener = (event: IpcRendererEvent, ...args: Array<unknown>) => void;

export interface RenderAppOptions {
  /** Database fixture: the parsed content of the .opossum file the app opens. */
  data?: ParsedFileContent;
  /** Redux actions dispatched before rendering. */
  actions?: Array<Action>;
  /** Overrides for the initial user settings. */
  userSettings?: Omit<Partial<UserSettings>, 'panelSizes'> & {
    panelSizes?: Partial<UserSettings['panelSizes']>;
  };
}

export interface RenderAppResult {
  store: Awaited<ReturnType<typeof createTestStore>>;
  /**
   * Simulates the Electron main process sending an event on an IPC channel,
   * e.g. a click on a native menu item.
   */
  sendToChannel: (
    channel: AllowedFrontendChannels,
    ...args: Array<unknown>
  ) => void;
}

/**
 * Renders the full app (App + Toaster), backed by the real backend command
 * handlers executing against a real database seeded with `data` (if supplied).
 */
export async function renderApp(
  options: RenderAppOptions = {},
): Promise<RenderAppResult> {
  const { data, actions, userSettings } = options;
  const store = await createTestStore(data);
  actions?.forEach(store.dispatch);

  if (userSettings) {
    const { panelSizes, ...rest } = userSettings;
    const mergedUserSettings: UserSettings = {
      ...DEFAULT_USER_SETTINGS,
      ...rest,
      panelSizes: {
        ...DEFAULT_USER_SETTINGS.panelSizes,
        ...panelSizes,
      },
    };
    vi.spyOn(window.electronAPI, 'getUserSettings').mockResolvedValue(
      mergedUserSettings,
    );
  }

  const channelListeners = new Map<AllowedFrontendChannels, Set<IpcListener>>();
  vi.spyOn(window.electronAPI, 'on').mockImplementation((channel, listener) => {
    const listeners = channelListeners.get(channel) ?? new Set();
    listeners.add(listener as IpcListener);
    channelListeners.set(channel, listeners);
    return () => {
      listeners.delete(listener as IpcListener);
    };
  });

  function sendToChannel(
    channel: AllowedFrontendChannels,
    ...args: Array<unknown>
  ): void {
    const listeners = channelListeners.get(channel);
    if (!listeners?.size) {
      throw new Error(
        `No listeners registered for IPC channel '${channel}'. Has the app finished mounting?`,
      );
    }
    const event = {} as IpcRendererEvent;
    listeners.forEach((listener) => listener(event, ...args));
  }

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <VirtuosoMockContext value={{ itemHeight: 40, viewportHeight: 1200 }}>
            <App />
            <Toaster />
          </VirtuosoMockContext>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>,
  );

  await waitFor(() => {
    if (!channelListeners.size) {
      throw new Error('App did not register any IPC listeners');
    }
  });

  // Panel layout effects measure a zero-size DOM in happy-dom and may have
  // overwritten user settings derived data; apply overrides after mounting.
  if (userSettings) {
    const { panelSizes, ...rest } = userSettings;
    const mergedPanelSizes = {
      ...DEFAULT_USER_SETTINGS.panelSizes,
      ...panelSizes,
    };
    store.dispatch(
      setUserSetting({
        ...rest,
        panelSizes: mergedPanelSizes,
      }),
    );
    await waitFor(() => {
      const current = (
        store.getState() as {
          userSettingsState?: { panelSizes?: Record<string, unknown> };
        }
      ).userSettingsState?.panelSizes;
      for (const [key, value] of Object.entries(mergedPanelSizes)) {
        if (value !== null && current?.[key] !== value) {
          throw new Error(`Panel size override for ${key} not applied`);
        }
      }
    });
  }

  return { store, sendToChannel };
}
