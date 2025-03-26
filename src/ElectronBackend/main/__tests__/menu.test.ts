// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import electron, { BrowserWindow, MenuItemConstructorOptions } from 'electron';

import { createMenu } from '../menu';
import { UserSettingsService } from '../user-settings-service';

jest.mock('electron', () => ({
  BrowserWindow: class BrowserWindowMock {},
  app: {
    isPackaged: true,
  },
  Menu: {
    buildFromTemplate: jest.fn(),
    setApplicationMenu: jest.fn(),
  },
}));

jest.mock('electron-settings');

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
        electron.Menu.buildFromTemplate as jest.Mock
      ).mock.calls[0][0];

      const usedIcons = getUsedIcons(menuInput);

      usedIcons.forEach((icon) =>
        expect(icon).toContain(testCase.expectedIconFileKeyword),
      );
    });
  });
});
