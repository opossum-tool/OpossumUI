// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';
import { BrowserWindow, net } from 'electron';

import { setGlobalBackendState } from '../ElectronBackend/main/globalBackendState';
import { getHelpMenu } from '../ElectronBackend/main/menu/helpMenu';
import { menuItemIds } from '../ElectronBackend/main/menu/menuItemIds';
import {
  checkForUpdates,
  getUpdateState,
  stopAutomaticUpdateChecks,
} from '../ElectronBackend/main/update-service';
import { AllowedFrontendChannels } from '../shared/ipc-channels';
import { text } from '../shared/text';
import { renderApp, type RenderAppResult } from './helpers/render-app';
import { gotoReportView } from './helpers/ui';

vi.mock('electron', () => ({
  app: { isPackaged: true, runningUnderARM64Translation: false },
  BrowserWindow: { getAllWindows: vi.fn() },
  net: { fetch: vi.fn() },
  nativeTheme: { shouldUseDarkColors: false },
  default: { nativeTheme: { shouldUseDarkColors: false } },
}));

vi.mock('electron-settings', () => ({
  default: {
    get: vi.fn().mockResolvedValue(false),
    set: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../commitInfo.json', () => ({
  default: { commitInfo: 'OpossumUI-2026-10-20' },
}));

const releaseEndpoint =
  'https://api.github.com/repos/opossum-tool/OpossumUI/releases/latest';

describe('checking for updates through the Help menu', () => {
  afterEach(() => {
    stopAutomaticUpdateChecks();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    setGlobalBackendState({});
  });

  it.each(['audit', 'report'] as const)(
    'shows and dismisses the real update failure banner in the %s view',
    async (view) => {
      vi.stubEnv('APPIMAGE', '/app');
      vi.stubEnv('SNAP', '');
      vi.mocked(net.fetch).mockResolvedValue(
        new Response('Unavailable', { status: 503 }),
      );

      const harness: {
        sendToChannel?: RenderAppResult['sendToChannel'];
      } = {};
      const send = vi.fn(
        (channel: AllowedFrontendChannels, ...args: Array<unknown>) =>
          harness.sendToChannel?.(channel, ...args),
      );
      const mockedWindow = {
        isDestroyed: () => false,
        webContents: {
          isDestroyed: () => false,
          send,
        },
      } as unknown as Electron.BrowserWindow;
      vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([mockedWindow]);

      vi.spyOn(window.electronAPI, 'checkForUpdates').mockImplementation(
        checkForUpdates,
      );
      vi.spyOn(window.electronAPI, 'getUpdateState').mockImplementation(() =>
        Promise.resolve(getUpdateState()),
      );

      const { sendToChannel } = await renderApp({
        userSettings: { automaticallyCheckForUpdates: false },
      });
      harness.sendToChannel = sendToChannel;
      if (view === 'report') {
        await gotoReportView();
      }

      const helpMenu = await getHelpMenu(mockedWindow.webContents, vi.fn());
      const updateItem = (
        helpMenu.submenu as Array<Electron.MenuItemConstructorOptions>
      ).find(({ id }) => id === menuItemIds.helpCheckForUpdates);
      expect(updateItem).toBeDefined();
      expect(updateItem?.enabled).toBe(true);
      updateItem?.click?.({} as Electron.MenuItem, mockedWindow, {});

      expect(
        await screen.findByText(text.updateApp.fetchFailed),
      ).toBeInTheDocument();
      expect(net.fetch).toHaveBeenCalledWith(
        releaseEndpoint,
        expect.objectContaining({
          headers: { Accept: 'application/vnd.github+json' },
        }),
      );
      expect(net.fetch).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith(
        AllowedFrontendChannels.CheckForUpdatesRequested,
      );
      expect(send).toHaveBeenCalledWith(
        AllowedFrontendChannels.UpdateStateChanged,
        { status: 'checking' },
      );
      expect(send).toHaveBeenCalledWith(
        AllowedFrontendChannels.UpdateStateChanged,
        { status: 'error' },
      );

      fireEvent.click(
        screen.getByRole('button', { name: text.updateApp.dismissed }),
      );
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    },
  );
});
