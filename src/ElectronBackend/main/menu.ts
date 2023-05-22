// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import electron, { app, BrowserWindow, Menu, shell } from 'electron';
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
  const nativeTheme = electron.nativeTheme;
  return Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/open-white.png')
            : path.join(getBasePathOfAssets(), 'icons/open-black.png'),
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click(): void {
            getOpenFileListener(mainWindow)();
          },
        },
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/save-white.png')
            : path.join(getBasePathOfAssets(), 'icons/save-black.png'),
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
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/export-white.png')
            : path.join(getBasePathOfAssets(), 'icons/export-black.png'),
          submenu: [
            {
              label: 'Follow-Up',
              icon: nativeTheme?.shouldUseDarkColors
                ? path.join(getBasePathOfAssets(), 'icons/follow-up-white.png')
                : path.join(getBasePathOfAssets(), 'icons/follow-up-black.png'),
              click(): void {
                setLoadingState(mainWindow.webContents, true);
                webContents.send(
                  AllowedFrontendChannels.ExportFileRequest,
                  ExportType.FollowUp
                );
              },
            },
            {
              icon: nativeTheme?.shouldUseDarkColors
                ? path.join(getBasePathOfAssets(), 'icons/com-list-white.png')
                : path.join(getBasePathOfAssets(), 'icons/com-list-black.png'),
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
              icon: nativeTheme?.shouldUseDarkColors
                ? path.join(getBasePathOfAssets(), 'icons/det-list-white.png')
                : path.join(getBasePathOfAssets(), 'icons/det-list-black.png'),
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
              icon: nativeTheme?.shouldUseDarkColors
                ? path.join(getBasePathOfAssets(), 'icons/yaml-white.png')
                : path.join(getBasePathOfAssets(), 'icons/yaml-black.png'),
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
              icon: nativeTheme?.shouldUseDarkColors
                ? path.join(getBasePathOfAssets(), 'icons/json-white.png')
                : path.join(getBasePathOfAssets(), 'icons/json-black.png'),
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
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/about-white.png')
            : path.join(getBasePathOfAssets(), 'icons/about-black.png'),
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
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/statictics-white.png')
            : path.join(getBasePathOfAssets(), 'icons/statictics-black.png'),
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
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/restore-white.png')
            : path.join(getBasePathOfAssets(), 'icons/restore-black.png'),
          label: 'Set Path to Sources',
          click(): void {
            getSelectBaseURLListener(mainWindow)();
          },
        },
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/quit-white.png')
            : path.join(getBasePathOfAssets(), 'icons/quit-black.png'),
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
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/undo-white.png')
            : path.join(getBasePathOfAssets(), 'icons/undo-black.png'),
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo',
        },
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/redo-white.png')
            : path.join(getBasePathOfAssets(), 'icons/redo-black.png'),
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo',
        },
        { type: 'separator' },
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/cut-white.png')
            : path.join(getBasePathOfAssets(), 'icons/cut-black.png'),
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut',
        },
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/copy-white.png')
            : path.join(getBasePathOfAssets(), 'icons/copy-black.png'),
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        },
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/paste-white.png')
            : path.join(getBasePathOfAssets(), 'icons/paste-black.png'),
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste',
        },
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/select-all-white.png')
            : path.join(getBasePathOfAssets(), 'icons/select-all-black.png'),
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          role: 'selectAll',
        },
        { type: 'separator' },
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/search-white.png')
            : path.join(getBasePathOfAssets(), 'icons/search-black.png'),
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
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/developer-tool-white.png')
            : path.join(
                getBasePathOfAssets(),
                'icons/developer-tool-black.png'
              ),
          label: 'Show Developer Tools',
          role: 'toggleDevTools',
        },
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/full-screen-white.png')
            : path.join(getBasePathOfAssets(), 'icons/full-screen-black.png'),
          label: 'Full Screen',
          role: 'togglefullscreen',
        },
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/zoom-in-white.png')
            : path.join(getBasePathOfAssets(), 'icons/zoom-in-black.png'),
          label: 'Zoom In',
          role: 'zoomIn',
        },
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/zoom-out-white.png')
            : path.join(getBasePathOfAssets(), 'icons/zoom-out-black.png'),
          label: 'Zoom Out',
          role: 'zoomOut',
        },
      ],
    },
    {
      label: 'About',
      submenu: [
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/github-white.png')
            : path.join(getBasePathOfAssets(), 'icons/github-black.png'),
          label: 'Open on GitHub',
          click: async (): Promise<void> => {
            await shell.openExternal(
              'https://github.com/opossum-tool/opossumUI'
            );
          },
        },
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/notice-white.png')
            : path.join(getBasePathOfAssets(), 'icons/notice-black.png'),
          label: 'OpossumUI Notices',
          click: async (): Promise<void> => {
            await shell.openPath(getPathOfNoticeDocument());
          },
        },
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/chromium-white.png')
            : path.join(getBasePathOfAssets(), 'icons/chromium-black.png'),
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
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/user-guide-white.png')
            : path.join(getBasePathOfAssets(), 'icons/user-guide-black.png'),
          label: "User's Guide",
          click: async (): Promise<void> => {
            await shell.openExternal(
              'https://github.com/opossum-tool/OpossumUI/blob/main/USER_GUIDE.md'
            );
          },
        },
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/log-white.png')
            : path.join(getBasePathOfAssets(), 'icons/log-black.png'),
          label: 'Open log files folder',
          click: async (): Promise<void> => {
            await shell.openPath(app.getPath('logs'));
          },
        },
        {
          icon: nativeTheme?.shouldUseDarkColors
            ? path.join(getBasePathOfAssets(), 'icons/update-white.png')
            : path.join(getBasePathOfAssets(), 'icons/update-black.png'),
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
