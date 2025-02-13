// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app, BrowserWindow, Menu, shell } from 'electron';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import {
  ExportType,
  FileFormatInfo,
  FileType,
} from '../../shared/shared-types';
import { isFileLoaded } from '../utils/getLoadedFile';
import { getGlobalBackendState } from './globalBackendState';
import {
  getIconBasedOnTheme,
  makeFirstIconVisibleAndSecondHidden,
} from './iconHelpers';
import { getImportFileListener, getSelectBaseURLListener } from './listeners';
import {
  getPathOfChromiumNoticeDocument,
  getPathOfNoticeDocument,
} from './notice-document-helpers';
import { UserSettings } from './user-settings';

const INITIALLY_DISABLED_MENU_ITEMS = [
  'save',
  'projectMetadata',
  'projectStatistics',
  'followUp',
  'compactComponentList',
  'detailedComponentList',
  'spdxYAML',
  'spdxJSON',
  'selectAll',
  'searchAttributions',
  'searchSignals',
  'searchResourcesAll',
  'searchResourceLinked',
] as const;

type Item = { label: string; id: string };

const INITIALLY_DISABLED_ITEMS_INFO: Record<
  (typeof INITIALLY_DISABLED_MENU_ITEMS)[number],
  Item
> = {
  save: { label: 'Save', id: 'save' },
  followUp: { label: 'Follow-Up', id: 'follow-up' },
  compactComponentList: {
    label: 'Compact component list',
    id: 'compact-list',
  },
  detailedComponentList: {
    label: 'Detailed component list',
    id: 'detailed-list',
  },
  spdxYAML: { label: 'SPDX (yaml)', id: 'spdx-yaml' },
  spdxJSON: { label: 'SPDX (json)', id: 'spdx-json' },
  projectMetadata: { label: 'Project Metadata', id: 'project-metadata' },
  projectStatistics: {
    label: 'Project Statistics',
    id: 'project-statistics',
  },
  selectAll: { label: 'Select All', id: 'select-all' },
  searchAttributions: {
    label: 'Search Attributions',
    id: 'search-attributions',
  },
  searchSignals: { label: 'Search Signals', id: 'search-signals' },
  searchResourcesAll: {
    label: 'Search All Resources',
    id: 'search-resources-all',
  },
  searchResourceLinked: {
    label: 'Search Linked Resources',
    id: 'search-resources-linked',
  },
};

export const importFileFormats: Array<FileFormatInfo> = [
  {
    fileType: FileType.LEGACY_OPOSSUM,
    name: 'Legacy Opossum File',
    extensions: ['json', 'json.gz'],
  },
  {
    fileType: FileType.SCANCODE_JSON,
    name: 'ScanCode File',
    extensions: ['json'],
  },
];

export async function createMenu(mainWindow: BrowserWindow): Promise<Menu> {
  const webContents = mainWindow.webContents;
  const qaMode = await UserSettings.get('qaMode');

  return Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          icon: getIconBasedOnTheme(
            'icons/open-white.png',
            'icons/open-black.png',
          ),
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: () =>
            mainWindow.webContents.send(
              AllowedFrontendChannels.OpenFileWithUnsavedCheck,
            ),
        },
        {
          icon: getIconBasedOnTheme(
            'icons/import-white.png',
            'icons/import-black.png',
          ),
          label: 'Import File',
          submenu: importFileFormats.map((fileFormat) => ({
            label: `${fileFormat.name} (${fileFormat.extensions.map((ext) => `.${ext}`).join('/')})`,
            click: getImportFileListener(mainWindow, fileFormat),
          })),
        },
        {
          icon: getIconBasedOnTheme(
            'icons/save-white.png',
            'icons/save-black.png',
          ),
          label: INITIALLY_DISABLED_ITEMS_INFO.save.label,
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            webContents.send(AllowedFrontendChannels.SaveFileRequest, {
              saveFile: true,
            });
          },
          id: INITIALLY_DISABLED_ITEMS_INFO.save.id,
          enabled: false,
        },
        {
          label: 'Export',
          icon: getIconBasedOnTheme(
            'icons/export-white.png',
            'icons/export-black.png',
          ),
          submenu: [
            {
              label: INITIALLY_DISABLED_ITEMS_INFO.followUp.label,
              icon: getIconBasedOnTheme(
                'icons/follow-up-white.png',
                'icons/follow-up-black.png',
              ),
              click: () => {
                webContents.send(
                  AllowedFrontendChannels.ExportFileRequest,
                  ExportType.FollowUp,
                );
              },
              id: INITIALLY_DISABLED_ITEMS_INFO.followUp.id,
              enabled: false,
            },
            {
              icon: getIconBasedOnTheme(
                'icons/com-list-white.png',
                'icons/com-list-black.png',
              ),
              label: INITIALLY_DISABLED_ITEMS_INFO.compactComponentList.label,
              click: () => {
                webContents.send(
                  AllowedFrontendChannels.ExportFileRequest,
                  ExportType.CompactBom,
                );
              },
              id: INITIALLY_DISABLED_ITEMS_INFO.compactComponentList.id,
              enabled: false,
            },
            {
              icon: getIconBasedOnTheme(
                'icons/det-list-white.png',
                'icons/det-list-black.png',
              ),
              label: INITIALLY_DISABLED_ITEMS_INFO.detailedComponentList.label,
              click: () => {
                webContents.send(
                  AllowedFrontendChannels.ExportFileRequest,
                  ExportType.DetailedBom,
                );
              },
              id: INITIALLY_DISABLED_ITEMS_INFO.detailedComponentList.id,
              enabled: false,
            },
            {
              icon: getIconBasedOnTheme(
                'icons/yaml-white.png',
                'icons/yaml-black.png',
              ),
              label: INITIALLY_DISABLED_ITEMS_INFO.spdxYAML.label,
              click: () => {
                webContents.send(
                  AllowedFrontendChannels.ExportFileRequest,
                  ExportType.SpdxDocumentYaml,
                );
              },
              id: INITIALLY_DISABLED_ITEMS_INFO.spdxYAML.id,
              enabled: false,
            },
            {
              icon: getIconBasedOnTheme(
                'icons/json-white.png',
                'icons/json-black.png',
              ),
              label: INITIALLY_DISABLED_ITEMS_INFO.spdxJSON.label,
              click: () => {
                webContents.send(
                  AllowedFrontendChannels.ExportFileRequest,
                  ExportType.SpdxDocumentJson,
                );
              },
              id: INITIALLY_DISABLED_ITEMS_INFO.spdxJSON.id,
              enabled: false,
            },
          ],
        },
        {
          icon: getIconBasedOnTheme(
            'icons/about-white.png',
            'icons/about-black.png',
          ),
          label: INITIALLY_DISABLED_ITEMS_INFO.projectMetadata.label,
          click: () => {
            if (isFileLoaded(getGlobalBackendState())) {
              webContents.send(
                AllowedFrontendChannels.ShowProjectMetadataPopup,
                {
                  showProjectMetadataPopup: true,
                },
              );
            }
          },
          id: INITIALLY_DISABLED_ITEMS_INFO.projectMetadata.id,
          enabled: false,
        },
        {
          icon: getIconBasedOnTheme(
            'icons/statictics-white.png',
            'icons/statictics-black.png',
          ),
          label: INITIALLY_DISABLED_ITEMS_INFO.projectStatistics.label,
          click: () => {
            if (isFileLoaded(getGlobalBackendState())) {
              webContents.send(
                AllowedFrontendChannels.ShowProjectStatisticsPopup,
                {
                  showProjectStatisticsPopup: true,
                },
              );
            }
          },
          id: INITIALLY_DISABLED_ITEMS_INFO.projectStatistics.id,
          enabled: false,
        },
        {
          icon: getIconBasedOnTheme(
            'icons/restore-white.png',
            'icons/restore-black.png',
          ),
          label: 'Set Path to Sources',
          click: () => {
            getSelectBaseURLListener(mainWindow)();
          },
        },
        {
          icon: getIconBasedOnTheme(
            'icons/quit-white.png',
            'icons/quit-black.png',
          ),
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          icon: getIconBasedOnTheme(
            'icons/undo-white.png',
            'icons/undo-black.png',
          ),
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          role: 'undo',
        },
        {
          icon: getIconBasedOnTheme(
            'icons/redo-white.png',
            'icons/redo-black.png',
          ),
          label: 'Redo',
          accelerator: 'Shift+CmdOrCtrl+Z',
          role: 'redo',
        },
        { type: 'separator' },
        {
          icon: getIconBasedOnTheme(
            'icons/cut-white.png',
            'icons/cut-black.png',
          ),
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          role: 'cut',
        },
        {
          icon: getIconBasedOnTheme(
            'icons/copy-white.png',
            'icons/copy-black.png',
          ),
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          role: 'copy',
        },
        {
          icon: getIconBasedOnTheme(
            'icons/paste-white.png',
            'icons/paste-black.png',
          ),
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          role: 'paste',
        },
        {
          icon: getIconBasedOnTheme(
            'icons/select-all-white.png',
            'icons/select-all-black.png',
          ),
          label: INITIALLY_DISABLED_ITEMS_INFO.selectAll.label,
          accelerator: 'CmdOrCtrl+A',
          role: 'selectAll',
          id: INITIALLY_DISABLED_ITEMS_INFO.selectAll.id,
          enabled: false,
        },
        { type: 'separator' },
        {
          icon: getIconBasedOnTheme(
            'icons/magnifying-glass-white.png',
            'icons/magnifying-glass-black.png',
          ),
          label: INITIALLY_DISABLED_ITEMS_INFO.searchAttributions.label,
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => {
            if (isFileLoaded(getGlobalBackendState())) {
              webContents.send(AllowedFrontendChannels.SearchAttributions);
            }
          },
          id: INITIALLY_DISABLED_ITEMS_INFO.searchAttributions.id,
          enabled: false,
        },
        {
          icon: getIconBasedOnTheme(
            'icons/magnifying-glass-white.png',
            'icons/magnifying-glass-black.png',
          ),
          label: INITIALLY_DISABLED_ITEMS_INFO.searchSignals.label,
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            if (isFileLoaded(getGlobalBackendState())) {
              webContents.send(AllowedFrontendChannels.SearchSignals);
            }
          },
          id: INITIALLY_DISABLED_ITEMS_INFO.searchSignals.id,
          enabled: false,
        },
        {
          icon: getIconBasedOnTheme(
            'icons/search-white.png',
            'icons/search-black.png',
          ),
          label: INITIALLY_DISABLED_ITEMS_INFO.searchResourcesAll.label,
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            if (isFileLoaded(getGlobalBackendState())) {
              webContents.send(AllowedFrontendChannels.SearchResources);
            }
          },
          id: INITIALLY_DISABLED_ITEMS_INFO.searchResourcesAll.id,
          enabled: false,
        },
        {
          icon: getIconBasedOnTheme(
            'icons/search-white.png',
            'icons/search-black.png',
          ),
          label: INITIALLY_DISABLED_ITEMS_INFO.searchResourceLinked.label,
          accelerator: 'CmdOrCtrl+Shift+L',
          click: () => {
            if (isFileLoaded(getGlobalBackendState())) {
              webContents.send(AllowedFrontendChannels.SearchLinkedResources);
            }
          },
          id: INITIALLY_DISABLED_ITEMS_INFO.searchResourceLinked.id,
          enabled: false,
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          icon: getIconBasedOnTheme(
            'icons/developer-tool-white.png',
            'icons/developer-tool-black.png',
          ),
          label: 'Show Developer Tools',
          role: 'toggleDevTools',
        },
        {
          icon: getIconBasedOnTheme(
            'icons/full-screen-white.png',
            'icons/full-screen-black.png',
          ),
          label: 'Full Screen',
          role: 'togglefullscreen',
        },
        {
          icon: getIconBasedOnTheme(
            'icons/zoom-in-white.png',
            'icons/zoom-in-black.png',
          ),
          label: 'Zoom In',
          role: 'zoomIn',
        },
        {
          icon: getIconBasedOnTheme(
            'icons/zoom-out-white.png',
            'icons/zoom-out-black.png',
          ),
          label: 'Zoom Out',
          role: 'zoomOut',
        },
        {
          icon: getIconBasedOnTheme(
            'icons/check-box-blank-white.png',
            'icons/check-box-blank-black.png',
          ),
          label: 'QA Mode',
          id: 'disabled-qa-mode',
          click: () => {
            makeFirstIconVisibleAndSecondHidden(
              'enabled-qa-mode',
              'disabled-qa-mode',
            );
            void UserSettings.set('qaMode', true);
          },
          visible: !qaMode,
        },
        {
          icon: getIconBasedOnTheme(
            'icons/check-box-white.png',
            'icons/check-box-black.png',
          ),
          label: 'QA Mode',
          id: 'enabled-qa-mode',
          click: () => {
            makeFirstIconVisibleAndSecondHidden(
              'disabled-qa-mode',
              'enabled-qa-mode',
            );
            void UserSettings.set('qaMode', false);
          },
          visible: !!qaMode,
        },
      ],
    },
    {
      label: 'About',
      submenu: [
        {
          icon: getIconBasedOnTheme(
            'icons/github-white.png',
            'icons/github-black.png',
          ),
          label: 'Open on GitHub',
          click: () =>
            shell.openExternal('https://github.com/opossum-tool/opossumUI'),
        },
        {
          icon: getIconBasedOnTheme(
            'icons/notice-white.png',
            'icons/notice-black.png',
          ),
          label: 'OpossumUI Notices',
          click: () => shell.openPath(getPathOfNoticeDocument()),
        },
        {
          icon: getIconBasedOnTheme(
            'icons/chromium-white.png',
            'icons/chromium-black.png',
          ),
          label: 'Chromium Notices',
          click: () => shell.openPath(getPathOfChromiumNoticeDocument()),
        },
      ],
    },
    {
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
          icon: getIconBasedOnTheme(
            'icons/log-white.png',
            'icons/log-black.png',
          ),
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
    },
  ]);
}

export function activateMenuItems(): void {
  const menu = Menu.getApplicationMenu();
  INITIALLY_DISABLED_MENU_ITEMS.forEach((key) => {
    const menuItem = menu?.getMenuItemById(
      INITIALLY_DISABLED_ITEMS_INFO[key].id,
    );
    if (menuItem) {
      menuItem.enabled = true;
    }
  });
}
