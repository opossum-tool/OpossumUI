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
import { getBasePathOfAssets } from './getPath';
import path from 'path';

export function createMenu(mainWindow: BrowserWindow): Menu {
  const webContents = mainWindow.webContents;

  return Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          icon: path.join(getBasePathOfAssets(), 'icons/open.png'),
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click(): void {
            getOpenFileListener(mainWindow)();
          },
        },
        {
          icon: path.join(getBasePathOfAssets(), 'icons/save.png'),
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
          icon: path.join(getBasePathOfAssets(), 'icons/export.png'),
          submenu: [
            {
              label: 'Follow-Up',
              icon: path.join(getBasePathOfAssets(), 'icons/follow-up.png'),
              click(): void {
                setLoadingState(mainWindow.webContents, true);
                webContents.send(
                  AllowedFrontendChannels.ExportFileRequest,
                  ExportType.FollowUp
                );
              },
            },
            {
              icon: path.join(getBasePathOfAssets(), 'icons/com-list.png'),
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
              icon: path.join(getBasePathOfAssets(), 'icons/det-list.png'),
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
              icon: path.join(getBasePathOfAssets(), 'icons/yaml.png'),
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
              icon: path.join(getBasePathOfAssets(), 'icons/json-file.png'),
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
          icon: path.join(getBasePathOfAssets(), 'icons/metadata.png'),
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
          icon: path.join(getBasePathOfAssets(), 'icons/statictics.png'),
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
          icon: path.join(getBasePathOfAssets(), 'icons/path.png'),
          label: 'Set Path to Sources',
          click(): void {
            getSelectBaseURLListener(mainWindow)();
          },
        },
        {
          icon: path.join(getBasePathOfAssets(), 'icons/quit.png'),
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
        {
          icon: path.join(getBasePathOfAssets(), 'icons/undo.png'),
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo',
        },
        {
          icon: path.join(getBasePathOfAssets(), 'icons/redo.png'),
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo',
        },
        { type: 'separator' },
        {
          icon: path.join(getBasePathOfAssets(), 'icons/cut.png'),
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut',
        },
        {
          icon: path.join(getBasePathOfAssets(), 'icons/copy.png'),
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        },
        {
          icon: path.join(getBasePathOfAssets(), 'icons/paste.png'),
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste',
        },
        {
          icon: path.join(getBasePathOfAssets(), 'icons/select-all.png'),
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectAll',
        },
        { type: 'separator' },
        {
          icon: path.join(getBasePathOfAssets(), 'icons/search.png'),
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
        {
          icon: path.join(getBasePathOfAssets(), 'icons/developer-tool.png'),
          label: 'Show Developer Tools',
          role: 'toggleDevTools',
        },
        {
          icon: path.join(getBasePathOfAssets(), 'icons/full-screen.png'),
          label: 'Full Screen',
          role: 'togglefullscreen',
        },
        {
          icon: path.join(getBasePathOfAssets(), 'icons/zoom-in.png'),
          label: 'Zoom In',
          role: 'zoomIn',
        },
        {
          icon: path.join(getBasePathOfAssets(), 'icons/zoom-out.png'),
          label: 'Zoom Out',
          role: 'zoomOut',
        },
      ],
    },
    {
      label: 'About',
      submenu: [
        {
          icon: path.join(getBasePathOfAssets(), 'icons/github.png'),
          label: 'Open on GitHub',
          click: async (): Promise<void> => {
            await shell.openExternal(
              'https://github.com/opossum-tool/opossumUI'
            );
          },
        },
        {
          icon: path.join(getBasePathOfAssets(), 'icons/notice.png'),
          label: 'OpossumUI Notices',
          click: async (): Promise<void> => {
            await shell.openPath(getPathOfNoticeDocument());
          },
        },
        {
          icon: path.join(getBasePathOfAssets(), 'icons/chromium.png'),
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
          icon: path.join(getBasePathOfAssets(), 'icons/user-guide.png'),
          label: "User's Guide",
          click: async (): Promise<void> => {
            await shell.openExternal(
              'https://github.com/opossum-tool/OpossumUI/blob/main/USER_GUIDE.md'
            );
          },
        },
        {
          icon: path.join(getBasePathOfAssets(), 'icons/log.png'),
          label: 'Open log files folder',
          click: async (): Promise<void> => {
            await shell.openPath(app.getPath('logs'));
          },
        },
        {
          icon: path.join(getBasePathOfAssets(), 'icons/updated.png'),
          label: 'Check for updates',
          click(): void {
            webContents.send(AllowedFrontendChannels.ShowUpdateAppPopup, {
              showUpdateAppPopup: true,
            });
          },
        },
      ],
    },
  ]);
}
