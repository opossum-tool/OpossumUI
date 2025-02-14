// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, Menu } from 'electron';

import { getAboutMenu } from './menu/aboutMenu';
import { getEditMenu } from './menu/editMenu';
import { getFileMenu } from './menu/fileMenu';
import { getHelpMenu } from './menu/helpMenu';
import { getViewMenu } from './menu/viewMenu';

export async function createMenu(mainWindow: BrowserWindow): Promise<Menu> {
  const webContents = mainWindow.webContents;

  return Menu.buildFromTemplate([
    getFileMenu(mainWindow),
    getEditMenu(webContents),
    await getViewMenu(),
    getAboutMenu(),
    getHelpMenu(webContents),
  ]);
}
