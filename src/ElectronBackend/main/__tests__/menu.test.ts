// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import electron, {
  BrowserWindow,
  type MenuItemConstructorOptions,
} from 'electron';
import type { Mock } from 'vitest';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { text } from '../../../shared/text';
import { setGlobalBackendState } from '../globalBackendState';
import { createMenu } from '../menu';
import { getFileMenu, importFileFormats } from '../menu/fileMenu';
import { getHelpMenu } from '../menu/helpMenu';
import { menuItemIds } from '../menu/menuItemIds';
import * as updateService from '../update-service';
import { UserSettingsService } from '../user-settings-service';

vi.mock('electron', async () => {
  const mockElectron = {
    BrowserWindow: class BrowserWindowMock {},
    app: {
      isPackaged: true,
    },
    ...(await import('./electron-mocks')).menuMock,
    nativeTheme: {},
  };
  return {
    default: mockElectron,
    ...mockElectron,
  };
});

vi.mock('electron-settings');

const getUsedIcons = (
  menuInput: Array<MenuItemConstructorOptions>,
): Array<string> => {
  const result: Array<string> = [];
  menuInput.forEach((menuItem) => {
    if (menuItem.submenu) {
      result.push(
        ...getUsedIcons(menuItem.submenu as Array<MenuItemConstructorOptions>),
      );
    } else if (menuItem.icon) {
      result.push(menuItem.icon as string);
    }
  });
  return result;
};

describe('create menu', () => {
  afterEach(() => {
    setGlobalBackendState({});
  });

  const testCases = [
    {
      darkMode: true,
      expectedIconFileKeyword: 'white',
    },
    {
      darkMode: false,
      expectedIconFileKeyword: 'black',
    },
  ];
  testCases.forEach((testCase) => {
    it(`evaluates ${testCase.darkMode ? 'dark' : 'light'} mode properly`, async () => {
      await UserSettingsService.init();
      const mainWindow = new BrowserWindow();

      // Important to set this up only here and not in the mock setup
      // as it is in the real run only set up during the main window setup
      // @ts-expect-error-error
      electron.nativeTheme = { shouldUseDarkColors: testCase.darkMode };
      await createMenu(mainWindow);

      expect(electron.Menu.buildFromTemplate).toHaveBeenCalled();
      const menuInput: Array<MenuItemConstructorOptions> = (
        electron.Menu.buildFromTemplate as Mock
      ).mock.calls[0][0];

      const usedIcons = getUsedIcons(menuInput);

      usedIcons.forEach((icon) =>
        expect(icon).toContain(testCase.expectedIconFileKeyword),
      );
    });
  });

  it('lists import formats directly and keeps split-file merging separate', async () => {
    await UserSettingsService.init();
    const mainWindow = new BrowserWindow();
    const fileMenu = await getFileMenu(mainWindow, vi.fn(), false);
    const items = fileMenu.submenu as Array<MenuItemConstructorOptions>;
    const importMenu = items.find(
      ({ label }) => label === text.menu.fileSubmenu.import,
    );
    const mergeMenu = items.find(
      ({ label }) => label === text.menu.fileSubmenu.merge,
    );
    const importItems =
      importMenu?.submenu as Array<MenuItemConstructorOptions>;
    expect(importItems.map(({ label }) => label)).toEqual(
      importFileFormats.map(text.menu.fileSubmenu.importFileSubmenu),
    );
    expect(mergeMenu?.submenu).toBeUndefined();
    expect(mergeMenu?.enabled).toBe(true);
  });

  it('requests an update check from the shared banner when the help item is clicked', async () => {
    await UserSettingsService.init();
    const send = vi.fn();
    const mainWindow = {
      webContents: { send },
    } as unknown as BrowserWindow;
    const helpMenu = await getHelpMenu(mainWindow.webContents, vi.fn());
    const items = helpMenu.submenu as Array<MenuItemConstructorOptions>;
    const checkForUpdates = items.find(
      ({ label }) => label === text.menu.helpSubmenu.checkForUpdates,
    );

    checkForUpdates?.click?.({} as Electron.MenuItem, mainWindow, {});

    expect(send).toHaveBeenCalledWith(
      AllowedFrontendChannels.CheckForUpdatesRequested,
    );
  });

  it('starts and stops automatic checks after saving the menu preference', async () => {
    Object.defineProperty(BrowserWindow, 'getAllWindows', {
      configurable: true,
      value: vi.fn(() => []),
    });
    await UserSettingsService.init();
    await UserSettingsService.update({ automaticallyCheckForUpdates: false });
    const readPreference = vi
      .spyOn(UserSettingsService, 'get')
      .mockResolvedValueOnce(false as never)
      .mockResolvedValueOnce(true as never);
    const savePreference = vi.spyOn(UserSettingsService, 'update');
    const start = vi.spyOn(updateService, 'startAutomaticUpdateChecks');
    const stop = vi.spyOn(updateService, 'stopAutomaticUpdateChecks');
    const webContents = { send: vi.fn() } as unknown as Electron.WebContents;
    const updateMenu = vi.fn().mockResolvedValue(undefined);

    const enabledMenu = await getHelpMenu(webContents, updateMenu);
    const enabledItem = (
      enabledMenu.submenu as Array<MenuItemConstructorOptions>
    ).find(({ id }) => id === menuItemIds.helpAutomaticallyCheckForUpdates);
    await (enabledItem?.click?.(
      {} as Electron.MenuItem,
      {} as BrowserWindow,
      {},
    ) as unknown as Promise<void>);
    expect(savePreference).toHaveBeenLastCalledWith({
      automaticallyCheckForUpdates: true,
    });
    expect(savePreference.mock.invocationCallOrder[0]).toBeLessThan(
      start.mock.invocationCallOrder[0],
    );
    expect(start.mock.invocationCallOrder[0]).toBeLessThan(
      updateMenu.mock.invocationCallOrder[0],
    );
    expect(updateMenu).toHaveBeenCalledOnce();
    expect(start).toHaveBeenCalledOnce();

    const disabledMenu = await getHelpMenu(webContents, updateMenu);
    const disabledItem = (
      disabledMenu.submenu as Array<MenuItemConstructorOptions>
    ).find(({ id }) => id === menuItemIds.helpAutomaticallyCheckForUpdates);
    await (disabledItem?.click?.(
      {} as Electron.MenuItem,
      {} as BrowserWindow,
      {},
    ) as unknown as Promise<void>);
    expect(savePreference).toHaveBeenLastCalledWith({
      automaticallyCheckForUpdates: false,
    });
    expect(stop).toHaveBeenCalledOnce();
    expect(savePreference.mock.invocationCallOrder[1]).toBeLessThan(
      stop.mock.invocationCallOrder[0],
    );
    expect(stop.mock.invocationCallOrder[0]).toBeLessThan(
      updateMenu.mock.invocationCallOrder[1],
    );
    expect(updateMenu).toHaveBeenCalledTimes(2);
    readPreference.mockRestore();
    savePreference.mockRestore();
    start.mockRestore();
    stop.mockRestore();
  });

  it('enables merging into the current project for a loaded project', async () => {
    await UserSettingsService.init();
    setGlobalBackendState({
      projectId: 'project-id',
      opossumFilePath: '/tmp/project.opossum',
    });

    const mainWindow = new BrowserWindow();
    const fileMenu = await getFileMenu(mainWindow, vi.fn(), false);
    const items = fileMenu.submenu as Array<MenuItemConstructorOptions>;
    const mergeMenu = items.find(
      ({ label }) => label === text.menu.fileSubmenu.merge,
    );
    expect(mergeMenu?.enabled).toBe(true);
  });

  it('uses the currently loaded file when the merge menu is clicked', async () => {
    await UserSettingsService.init();
    const send = vi.fn();
    const mainWindow = {
      webContents: { send },
    } as unknown as BrowserWindow;
    setGlobalBackendState({ opossumFilePath: '/tmp/file-a.opossum' });

    const fileMenu = await getFileMenu(mainWindow, vi.fn(), false);
    const items = fileMenu.submenu as Array<MenuItemConstructorOptions>;
    const mergeMenu = items.find(
      ({ label }) => label === text.menu.fileSubmenu.merge,
    );

    setGlobalBackendState({ opossumFilePath: '/tmp/file-b.opossum' });
    mergeMenu?.click?.({} as Electron.MenuItem, mainWindow, {});

    expect(send).toHaveBeenCalledWith(
      AllowedFrontendChannels.ShowMergeOpossumFilesDialog,
      true,
      '/tmp/file-b.opossum',
    );
  });
});
