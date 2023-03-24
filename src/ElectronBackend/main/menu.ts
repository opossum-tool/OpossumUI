// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { app, BrowserWindow, Menu, shell } from 'electron';
import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import {
  getOpenFileListener,
  getSelectBaseURLListener,
  setLoadingState,
} from './listeners';
import { getGlobalBackendState } from './globalBackendState';
import {
  getPathOfChromiumNoticeDocument,
  getPathOfNoticeDocument,
} from './notice-document-helpers';
import { ExportType } from '../../shared/shared-types';
import { isFileLoaded } from '../utils/getLoadedFile';

export function createMenu(mainWindow: BrowserWindow): Menu {
  const webContents = mainWindow.webContents;

  return Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click(): void {
            getOpenFileListener(mainWindow)();
          },
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click(): void {
            webContents.send(AllowedFrontendChannels.SaveFileRequest, {
              saveFile: true,
            });
          },
        },
        {
          label: 'Export',
          submenu: [
            {
              label: 'Follow-Up',
              click(): void {
                setLoadingState(mainWindow.webContents, true);
                webContents.send(
                  AllowedFrontendChannels.ExportFileRequest,
                  ExportType.FollowUp
                );
              },
            },
            {
              label: 'Compact component list',
              click(): void {
                setLoadingState(mainWindow.webContents, true);
                webContents.send(
                  AllowedFrontendChannels.ExportFileRequest,
                  ExportType.CompactBom
                );
              },
            },
            {
              label: 'Detailed component list',
              click(): void {
                setLoadingState(mainWindow.webContents, true);
                webContents.send(
                  AllowedFrontendChannels.ExportFileRequest,
                  ExportType.DetailedBom
                );
              },
            },
            {
              label: 'SPDX (yaml)',
              click(): void {
                setLoadingState(mainWindow.webContents, true);
                webContents.send(
                  AllowedFrontendChannels.ExportFileRequest,
                  ExportType.SpdxDocumentYaml
                );
              },
            },
            {
              label: 'SPDX (json)',
              click(): void {
                setLoadingState(mainWindow.webContents, true);
                webContents.send(
                  AllowedFrontendChannels.ExportFileRequest,
                  ExportType.SpdxDocumentJson
                );
              },
            },
          ],
        },
        {
          label: 'Project Metadata',
          click(): void {
            if (isFileLoaded(getGlobalBackendState())) {
              webContents.send(
                AllowedFrontendChannels.ShowProjectMetadataPopup,
                {
                  showProjectMetadataPopup: true,
                }
              );
            }
          },
        },
        {
          label: 'Project Statistics',
          click(): void {
            if (isFileLoaded(getGlobalBackendState())) {
              webContents.send(
                AllowedFrontendChannels.ShowProjectStatisticsPopup,
                {
                  showProjectStatisticsPopup: true,
                }
              );
            }
          },
        },
        {
          label: 'Set Path to Sources',
          click(): void {
            getSelectBaseURLListener(mainWindow)();
          },
        },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click(): void {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Search for Files and Directories',
          accelerator: 'CmdOrCtrl+F',
          click(): void {
            if (isFileLoaded(getGlobalBackendState())) {
              webContents.send(AllowedFrontendChannels.ShowSearchPopup, {
                showSearchPopup: true,
              });
            }
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Show Developer Tools', role: 'toggleDevTools' },
        { label: 'Full Screen', role: 'togglefullscreen' },
        { label: 'Zoom In', role: 'zoomIn' },
        { label: 'Zoom Out', role: 'zoomOut' },
      ],
    },
    {
      label: 'About',
      submenu: [
        {
          label: 'Open on GitHub',
          click: async (): Promise<void> => {
            await shell.openExternal(
              'https://github.com/opossum-tool/opossumUI'
            );
          },
        },
        {
          label: 'OpossumUI Notices',
          click: async (): Promise<void> => {
            await shell.openPath(getPathOfNoticeDocument());
          },
        },
        {
          label: 'Chromium Notices',
          click: async (): Promise<void> => {
            await shell.openPath(getPathOfChromiumNoticeDocument());
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: "User's Guide",
          click: async (): Promise<void> => {
            await shell.openExternal(
              'https://github.com/opossum-tool/OpossumUI/blob/main/USER_GUIDE.md'
            );
          },
        },
        {
          label: 'Open log files folder',
          click: async (): Promise<void> => {
            await shell.openPath(app.getPath('logs'));
          },
        },
      ],
    },
  ]);
}
