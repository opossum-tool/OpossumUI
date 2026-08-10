// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type BrowserWindow,
  Menu,
  type MenuItemConstructorOptions,
} from 'electron';
import os from 'os';

import { getMainDbClient } from '../dbProcess/dbProcessClient';
import { isFileLoaded } from '../utils/getLoadedFile';
import { getGlobalBackendState } from './globalBackendState';
import { getAboutMenu } from './menu/aboutMenu';
import { getEditMenu } from './menu/editMenu';
import { getFileMenu } from './menu/fileMenu';
import { getHelpMenu } from './menu/helpMenu';
import { menuItemIds } from './menu/menuItemIds';
import { getViewMenu } from './menu/viewMenu';

export async function createMenu(mainWindow: BrowserWindow): Promise<void> {
  const webContents = mainWindow.webContents;
  const isProjectSplit = isFileLoaded(getGlobalBackendState())
    ? (await getMainDbClient().api('isProjectSplit', undefined)).result
    : false;

  const updateMenu = () => createMenu(mainWindow);
  return Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      ...(os.platform() === 'darwin'
        ? [
            {
              id: menuItemIds.application,
              role: 'appMenu',
            } satisfies MenuItemConstructorOptions,
          ]
        : []),
      await getFileMenu(mainWindow, updateMenu, isProjectSplit),
      getEditMenu(webContents),
      await getViewMenu(updateMenu),
      getAboutMenu(),
      getHelpMenu(webContents),
    ]),
  );
}
