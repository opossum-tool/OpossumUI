// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app, type MenuItemConstructorOptions, shell } from 'electron';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { text } from '../../../shared/text';
import { getGlobalBackendState } from '../globalBackendState';
import { getIconBasedOnTheme } from '../iconHelpers';
import { menuItemIds } from './menuItemIds';

function getOpenLogFiles(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme('icons/log-white.png', 'icons/log-black.png'),
    label: text.menu.helpSubmenu.openLogFiles,
    id: menuItemIds.helpOpenLogFiles,
    click: () => shell.openPath(app.getPath('logs')),
  };
}

function getCheckForUpdates(
  webContents: Electron.WebContents,
): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/update-white.png',
      'icons/update-black.png',
    ),
    label: text.menu.helpSubmenu.checkForUpdates,
    id: menuItemIds.helpCheckForUpdates,
    click: () => {
      webContents.send(AllowedFrontendChannels.ShowUpdateAppPopup, {
        showUpdateAppPopup: true,
      });
    },
    enabled: !getGlobalBackendState().frontendPopupOpen,
  };
}

function getUsersGuide(): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/user-guide-white.png',
      'icons/user-guide-black.png',
    ),
    label: text.menu.helpSubmenu.userGuide,
    id: menuItemIds.helpUserGuide,
    click: () =>
      shell.openExternal(
        'https://github.com/opossum-tool/OpossumUI/blob/main/USER_GUIDE.md',
      ),
  };
}

export function getHelpMenu(
  webContents: Electron.WebContents,
): MenuItemConstructorOptions {
  return {
    label: text.menu.help,
    id: menuItemIds.help,
    submenu: [
      getUsersGuide(),
      getOpenLogFiles(),
      getCheckForUpdates(webContents),
    ],
  };
}
