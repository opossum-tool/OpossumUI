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
import * as dbProcessClient from '../../dbProcess/dbProcessClient';
import { setGlobalBackendState } from '../globalBackendState';
import { createMenu } from '../menu';
import { getEditMenu } from '../menu/editMenu';
import { getFileMenu, importFileFormats } from '../menu/fileMenu';
import { getHelpMenu } from '../menu/helpMenu';
import { menuItemIds } from '../menu/menuItemIds';
import * as updateService from '../update-service';
import { UserSettingsService } from '../user-settings-service';

vi.mock('electron', async () => {
  const mockElectron = {
    BrowserWindow: class BrowserWindowMock {
      isDestroyed() {
        return false;
      }
    },
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

  it('stops refreshing when the window closes during the split-project query', async () => {
    setGlobalBackendState({ opossumFilePath: '/project.opossum' });
    const query = Promise.withResolvers<{ result: boolean }>();
    const api = vi.fn().mockReturnValue(query.promise);
    const getClient = vi
      .spyOn(dbProcessClient, 'getMainDbClient')
      .mockReturnValue({ api } as unknown as dbProcessClient.DbProcessClient);
    const mainWindow = new BrowserWindow();
    const isDestroyed = vi.spyOn(mainWindow, 'isDestroyed');
    Object.defineProperty(mainWindow, 'webContents', {
      get() {
        if (isDestroyed()) {
          throw new Error('Object has been destroyed');
        }
        return undefined;
      },
    });
    vi.mocked(electron.Menu.setApplicationMenu).mockClear();

    try {
      const refreshing = createMenu(mainWindow);
      expect(api).toHaveBeenCalledWith('isProjectSplit', undefined);
      isDestroyed.mockReturnValue(true);
      query.resolve({ result: false });
      await refreshing;
      expect(electron.Menu.setApplicationMenu).not.toHaveBeenCalled();
    } finally {
      getClient.mockRestore();
    }
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

  it.each([
    { dialogOpen: true, activityActive: false },
    { dialogOpen: false, activityActive: true },
    { dialogOpen: true, activityActive: true },
  ])(
    'blocks project commands but leaves reference views available (dialog: $dialogOpen, activity: $activityActive)',
    async ({ dialogOpen, activityActive }) => {
      await UserSettingsService.init();
      setGlobalBackendState({
        opossumFilePath: '/project.opossum',
        frontendDialogOpen: dialogOpen,
        frontendActivityActive: activityActive,
      });
      const fileMenu = await getFileMenu(new BrowserWindow(), vi.fn(), false);
      const fileItems = fileMenu.submenu as Array<MenuItemConstructorOptions>;
      const itemById = (id: string) => fileItems.find((item) => item.id === id);

      expect(itemById(menuItemIds.projectMetadata)?.enabled).toBe(true);
      expect(itemById(menuItemIds.import)?.enabled).toBe(false);
      expect(itemById(menuItemIds.projectStatistics)?.enabled).toBe(false);
      expect(itemById(menuItemIds.saveFile)?.enabled).toBe(false);
    },
  );

  it('blocks attribution search while a dialog is open', async () => {
    await UserSettingsService.init();
    setGlobalBackendState({
      opossumFilePath: '/project.opossum',
      frontendDialogOpen: true,
      frontendActivityActive: false,
    });
    const mainWindow = new BrowserWindow();
    const editMenu = getEditMenu(mainWindow.webContents);
    const editItems = editMenu.submenu as Array<MenuItemConstructorOptions>;

    expect(
      editItems.find((item) => item.id === menuItemIds.searchAttributions)
        ?.enabled,
    ).toBe(false);
  });

  it.each([
    { dialogOpen: false, activityActive: false },
    { dialogOpen: true, activityActive: false },
    { dialogOpen: false, activityActive: true },
    { dialogOpen: true, activityActive: true },
  ])(
    'keeps the update check available and sends its event ($dialogOpen, $activityActive)',
    async ({ dialogOpen, activityActive }) => {
      await UserSettingsService.init();
      setGlobalBackendState({
        frontendDialogOpen: dialogOpen,
        frontendActivityActive: activityActive,
      });
      const send = vi.fn();
      const mainWindow = {
        webContents: { send },
      } as unknown as BrowserWindow;
      const helpMenu = await getHelpMenu(mainWindow.webContents, vi.fn());
      const items = helpMenu.submenu as Array<MenuItemConstructorOptions>;
      const checkForUpdates = items.find(
        ({ id }) => id === menuItemIds.helpCheckForUpdates,
      );

      expect(checkForUpdates?.enabled).toBe(true);
      checkForUpdates?.click?.({} as Electron.MenuItem, mainWindow, {});

      expect(send).toHaveBeenCalledWith(
        AllowedFrontendChannels.CheckForUpdatesRequested,
      );
    },
  );

  it.each([false, true])(
    'opens release notes from Help regardless of dialog state (open: %s)',
    async (popupOpen) => {
      await UserSettingsService.init();
      setGlobalBackendState({ frontendDialogOpen: popupOpen });
      const send = vi.fn();
      const mainWindow = {
        webContents: { send },
      } as unknown as BrowserWindow;
      const menu = await getHelpMenu(mainWindow.webContents, vi.fn());
      const item = (menu.submenu as Array<MenuItemConstructorOptions>).find(
        ({ id }) => id === menuItemIds.helpWhatsNew,
      );

      expect(item?.label).toBe(text.menu.helpSubmenu.whatsNew);
      expect(item?.enabled).toBe(true);
      item?.click?.({} as Electron.MenuItem, mainWindow, {});
      expect(send).toHaveBeenCalledWith(AllowedFrontendChannels.ShowWhatsNew);
    },
  );

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
