// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import electron, {
  BrowserWindow,
  type MenuItemConstructorOptions,
} from 'electron';
import type { Mock } from 'vitest';

import { text } from '../../../shared/text';
import { setGlobalBackendState } from '../globalBackendState';
import { createMenu } from '../menu';
import { getFileMenu, importFileFormats } from '../menu/fileMenu';
import { UserSettingsService } from '../user-settings-service';

vi.mock('electron', () => {
  const mockElectron = {
    BrowserWindow: class BrowserWindowMock {},
    app: {
      isPackaged: true,
    },
    Menu: {
      buildFromTemplate: vi.fn(),
      setApplicationMenu: vi.fn(),
    },
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
    const fileMenu = await getFileMenu(mainWindow, vi.fn());
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

  it('enables merging into the current project for a loaded project', async () => {
    await UserSettingsService.init();
    setGlobalBackendState({
      projectId: 'project-id',
      opossumFilePath: '/tmp/project.opossum',
    });

    const mainWindow = new BrowserWindow();
    const fileMenu = await getFileMenu(mainWindow, vi.fn());
    const items = fileMenu.submenu as Array<MenuItemConstructorOptions>;
    const mergeMenu = items.find(
      ({ label }) => label === text.menu.fileSubmenu.merge,
    );
    expect(mergeMenu?.enabled).toBe(true);
  });
});
