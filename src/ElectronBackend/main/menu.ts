// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import os from 'os';

import { getAboutMenu } from './menu/aboutMenu';
import { getEditMenu } from './menu/editMenu';
import { getFileMenu } from './menu/fileMenu';
import { getHelpMenu } from './menu/helpMenu';
import { getViewMenu } from './menu/viewMenu';

export type UpdateMenu = () => Promise<void>;

export async function createMenu(mainWindow: BrowserWindow): Promise<void> {
  const webContents = mainWindow.webContents;

  const updateMenu = () => createMenu(mainWindow);
  return Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      ...(os.platform() === 'darwin'
        ? [{ role: 'appMenu' } satisfies MenuItemConstructorOptions]
        : []),
      await getFileMenu(mainWindow, updateMenu),
      getEditMenu(webContents),
      await getViewMenu(updateMenu),
      getAboutMenu(),
      getHelpMenu(webContents),
    ]),
  );
}
