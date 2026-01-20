// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { dialog, systemPreferences } from 'electron';
import os from 'os';

import { getMessageBoxContentForErrorsWrapper } from '../errorHandling/errorHandling';
import { createWindow, loadWebApp } from './createWindow';
import { createMenu } from './menu';
import { openFileFromCliOrEnvVariableIfProvided } from './openFileFromCliOrEnvVariableIfProvided';
import { setupIpcHandling } from './setUpIpcHandling';
import { UserSettingsService } from './user-settings-service';

export async function main(): Promise<void> {
  try {
    if (os.platform() === 'darwin') {
      systemPreferences.setUserDefault(
        'AppleShowScrollBars',
        'string',
        'Always',
      );
    }

    const mainWindow = createWindow();

    await UserSettingsService.init();
    await createMenu(mainWindow);
    const updateMenu = () => createMenu(mainWindow);

    mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
      (details, callback) => {
        callback({
          requestHeaders: { ...details.requestHeaders, Origin: '*' },
        });
      },
    );

    mainWindow.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'access-control-allow-origin': ['*'],
            'Access-Control-Allow-Origin': [],
          },
        });
      },
    );

    setupIpcHandling(mainWindow, updateMenu);

    await loadWebApp(mainWindow);

    await openFileFromCliOrEnvVariableIfProvided(mainWindow, updateMenu);
  } catch (error) {
    if (error instanceof Error) {
      await dialog.showMessageBox(
        getMessageBoxContentForErrorsWrapper(true, error.stack)(error.message),
      );
    } else {
      await dialog.showMessageBox(
        getMessageBoxContentForErrorsWrapper(true)('Unexpected internal error'),
      );
    }
  }
}
