// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { dialog, ipcMain, systemPreferences } from 'electron';
import settings from 'electron-settings';
import { isEqual } from 'lodash';
import os from 'os';

import { IpcChannel } from '../../shared/ipc-channels';
import { UserSettings } from '../../shared/shared-types';
import { getMessageBoxContentForErrorsWrapper } from '../errorHandling/errorHandling';
import { createWindow } from './createWindow';
import {
  getConvertInputFileToDotOpossumAndOpenListener,
  getDeleteAndCreateNewAttributionFileListener,
  getExportFileListener,
  getKeepFileListener,
  getOpenDotOpossumFileInsteadListener,
  getOpenFileListener,
  getOpenLinkListener,
  getOpenOutdatedInputFileListener,
  getSaveFileListener,
  getSendErrorInformationListener,
} from './listeners';
import { openFileFromCliOrEnvVariableIfProvided } from './openFileFromCliOrEnvVariableIfProvided';

export async function main(): Promise<void> {
  try {
    if (os.platform() === 'darwin') {
      systemPreferences.setUserDefault(
        'AppleShowScrollBars',
        'string',
        'Always',
      );
    }

    const mainWindow = await createWindow();

    ipcMain.handle(
      IpcChannel.ConvertInputFile,
      getConvertInputFileToDotOpossumAndOpenListener(mainWindow),
    );
    ipcMain.handle(
      IpcChannel.UseOutdatedInputFile,
      getOpenOutdatedInputFileListener(mainWindow),
    );
    ipcMain.handle(
      IpcChannel.OpenDotOpossumFile,
      getOpenDotOpossumFileInsteadListener(mainWindow),
    );
    ipcMain.handle(IpcChannel.OpenFile, getOpenFileListener(mainWindow));
    ipcMain.handle(IpcChannel.SaveFile, getSaveFileListener(mainWindow));
    ipcMain.handle(
      IpcChannel.DeleteFile,
      getDeleteAndCreateNewAttributionFileListener(mainWindow),
    );
    ipcMain.handle(IpcChannel.KeepFile, getKeepFileListener(mainWindow));
    ipcMain.handle(
      IpcChannel.SendErrorInformation,
      getSendErrorInformationListener(mainWindow),
    );
    ipcMain.handle(IpcChannel.ExportFile, getExportFileListener(mainWindow));
    ipcMain.handle(IpcChannel.OpenLink, getOpenLinkListener());
    ipcMain.handle(IpcChannel.GetUserSettings, (_, key) => settings.get(key));
    ipcMain.handle(IpcChannel.SetUserSettings, (_, { key, value }) =>
      settings.set(key, value),
    );

    await initializeUserSettings();

    await openFileFromCliOrEnvVariableIfProvided(mainWindow);
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

async function initializeUserSettings(): Promise<void> {
  const current: Partial<UserSettings> = await settings.get();

  const updated = {
    ...current,
    showProjectStatistics: process.argv.includes('--skip-statistics')
      ? false
      : current?.showProjectStatistics ?? true,
  } satisfies UserSettings;

  if (!isEqual(current, updated)) {
    await settings.set(updated);
  }
}
