// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, MenuItemConstructorOptions } from 'electron';

import { text } from '../../../shared/text';
import { getIconBasedOnTheme } from '../iconHelpers';
import { createMenu } from '../menu';
import { UserSettings } from '../user-settings';

function getShowDevTools(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/developer-tool-white.png',
      'icons/developer-tool-black.png',
    ),
    label: text.menu.viewSubmenu.showDevTools,
    role: 'toggleDevTools',
  };
}

function getToggleFullScreen(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/full-screen-white.png',
      'icons/full-screen-black.png',
    ),
    label: text.menu.viewSubmenu.toggleFullScreen,
    role: 'togglefullscreen',
  };
}

function getZoomIn(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/zoom-in-white.png',
      'icons/zoom-in-black.png',
    ),
    label: text.menu.viewSubmenu.zoomIn,
    role: 'zoomIn',
  };
}

function getZoomOut(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/zoom-out-white.png',
      'icons/zoom-out-black.png',
    ),
    label: text.menu.viewSubmenu.zoomOut,
    role: 'zoomOut',
  };
}

async function getQaMode(
  mainWindow: BrowserWindow,
): Promise<MenuItemConstructorOptions> {
  const qaMode = (await UserSettings.get('qaMode')) ?? false;

  return {
    icon: qaMode
      ? getIconBasedOnTheme(
          'icons/check-box-white.png',
          'icons/check-box-black.png',
        )
      : getIconBasedOnTheme(
          'icons/check-box-blank-white.png',
          'icons/check-box-blank-black.png',
        ),
    label: text.menu.viewSubmenu.qaMode,
    id: qaMode ? 'enabled-qa-mode' : 'disabled-qa-mode',
    click: async () => {
      await UserSettings.set('qaMode', !qaMode);
      await createMenu(mainWindow);
    },
  };
}

export async function getViewMenu(
  mainWindow: BrowserWindow,
): Promise<MenuItemConstructorOptions> {
  return {
    label: text.menu.view,
    submenu: [
      getShowDevTools(),
      getToggleFullScreen(),
      getZoomIn(),
      getZoomOut(),
      await getQaMode(mainWindow),
    ],
  };
}
