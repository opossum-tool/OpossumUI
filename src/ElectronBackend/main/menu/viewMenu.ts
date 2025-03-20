// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, MenuItemConstructorOptions } from 'electron';

import { text } from '../../../shared/text';
import { getIconBasedOnTheme } from '../iconHelpers';
import { switchableMenuItem } from './switchableMenuItem';

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
  return switchableMenuItem(mainWindow, {
    id: 'qa-mode',
    label: text.menu.viewSubmenu.qaMode,
    userSettingsKey: 'qaMode',
  });
}

function getShowClassifications(
  mainWindow: BrowserWindow,
): Promise<MenuItemConstructorOptions> {
  return switchableMenuItem(mainWindow, {
    id: 'show-classifications',
    label: text.menu.viewSubmenu.showClassifications,
    userSettingsKey: 'showClassifications',
  });
}

function getShowCriticality(
  mainWindow: BrowserWindow,
): Promise<MenuItemConstructorOptions> {
  return switchableMenuItem(mainWindow, {
    id: 'show-criticality',
    label: text.menu.viewSubmenu.showCriticality,
    userSettingsKey: 'showCriticality',
  });
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
      await getShowCriticality(mainWindow),
      await getShowClassifications(mainWindow),
    ],
  };
}
