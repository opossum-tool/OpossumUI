// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app, shell } from 'electron';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { getIconBasedOnTheme } from '../iconHelpers';

export function getHelpMenu(webContents: Electron.WebContents) {
  return {
    label: 'Help',
    submenu: [
      {
        icon: getIconBasedOnTheme(
          'icons/user-guide-white.png',
          'icons/user-guide-black.png',
        ),
        label: "User's Guide",
        click: () =>
          shell.openExternal(
            'https://github.com/opossum-tool/OpossumUI/blob/main/USER_GUIDE.md',
          ),
      },
      {
        icon: getIconBasedOnTheme('icons/log-white.png', 'icons/log-black.png'),
        label: 'Open log files folder',
        click: () => shell.openPath(app.getPath('logs')),
      },
      {
        icon: getIconBasedOnTheme(
          'icons/update-white.png',
          'icons/update-black.png',
        ),
        label: 'Check for updates',
        click: () => {
          webContents.send(AllowedFrontendChannels.ShowUpdateAppPopup, {
            showUpdateAppPopup: true,
          });
        },
      },
    ],
  };
}
