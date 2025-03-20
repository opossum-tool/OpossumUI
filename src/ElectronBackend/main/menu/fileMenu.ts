// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  app,
  BrowserWindow,
  MenuItemConstructorOptions,
  WebContents,
} from 'electron';
import os from 'os';
import path from 'path';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import {
  ExportType,
  FileFormatInfo,
  FileType,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { isFileLoaded } from '../../utils/getLoadedFile';
import { getGlobalBackendState } from '../globalBackendState';
import { getIconBasedOnTheme } from '../iconHelpers';
import {
  getMergeListener,
  handleOpeningFile,
  importFileListener,
  selectBaseURLListener,
  setLoadingState,
} from '../listeners';
import logger from '../logger';
import { createMenu } from '../menu';
import { UserSettingsService } from '../user-settings-service';
import { DisabledMenuItemHandler } from './DisabledMenuItemHandler';

export const importFileFormats: Array<FileFormatInfo> = [
  {
    fileType: FileType.LEGACY_OPOSSUM,
    name: 'Legacy Opossum',
    extensions: ['json', 'json.gz'],
  },
  {
    fileType: FileType.SCANCODE_JSON,
    name: 'ScanCode',
    extensions: ['json'],
  },
  {
    fileType: FileType.OWASP_JSON,
    name: 'OWASP Dependency-Check',
    extensions: ['json'],
  },
];

function getOpenFile(mainWindow: BrowserWindow): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme('icons/open-white.png', 'icons/open-black.png'),
    label: text.menu.fileSubmenu.open,
    accelerator: 'CmdOrCtrl+O',
    click: () =>
      mainWindow.webContents.send(
        AllowedFrontendChannels.OpenFileWithUnsavedCheck,
      ),
  };
}

async function getOpenRecent(
  mainWindow: BrowserWindow,
): Promise<MenuItemConstructorOptions> {
  const recentlyOpenedPaths = await UserSettingsService.get(
    'recentlyOpenedPaths',
  );

  return {
    icon: getIconBasedOnTheme('icons/open-white.png', 'icons/open-black.png'),
    label: text.menu.fileSubmenu.openRecent,
    submenu: getOpenRecentSubmenu(mainWindow, recentlyOpenedPaths),
    enabled: !!recentlyOpenedPaths?.length,
  };
}

function getOpenRecentSubmenu(
  mainWindow: BrowserWindow,
  recentlyOpenedPaths: Array<string> | null,
): MenuItemConstructorOptions['submenu'] {
  if (!recentlyOpenedPaths?.length) {
    return undefined;
  }

  return [
    ...recentlyOpenedPaths.map<MenuItemConstructorOptions>((recentPath) => ({
      label: path.basename(recentPath, path.extname(recentPath)),
      click: ({ id }) =>
        handleOpeningFile(
          mainWindow,
          id,
          DisabledMenuItemHandler.activateMenuItems,
        ),
      id: recentPath,
    })),
    { type: 'separator' },
    {
      id: 'clear-recent',
      label: text.menu.fileSubmenu.clearRecent,
      click: async () => {
        await UserSettingsService.set('recentlyOpenedPaths', []);
        await createMenu(mainWindow);
      },
    },
  ];
}

function getImportFile(mainWindow: BrowserWindow): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/import-white.png',
      'icons/import-black.png',
    ),
    label: text.menu.fileSubmenu.import,
    submenu: importFileFormats.map((fileFormat) => ({
      label: text.menu.fileSubmenu.importSubmenu(fileFormat),
      click: importFileListener(mainWindow, fileFormat),
      id: `import ${fileFormat.name}`,
    })),
  };
}

function getMerge(mainWindow: BrowserWindow): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme('icons/merge-white.png', 'icons/merge-black.png'),
    label: text.menu.fileSubmenu.merge,
    submenu: importFileFormats.map((fileFormat) => ({
      label: text.menu.fileSubmenu.mergeSubmenu(fileFormat),
      click: getMergeListener(mainWindow, fileFormat),
      id: DisabledMenuItemHandler.registerDisabledMenuItem(),
      enabled: false,
    })),
  };
}

function getSaveFile(webContents: WebContents): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme('icons/save-white.png', 'icons/save-black.png'),
    label: text.menu.fileSubmenu.save,
    accelerator: 'CmdOrCtrl+S',
    click: () => {
      webContents.send(AllowedFrontendChannels.SaveFileRequest, {
        saveFile: true,
      });
    },
    id: DisabledMenuItemHandler.registerDisabledMenuItem(),
    enabled: false,
  };
}

function getProjectMetadata(
  webContents: WebContents,
): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme('icons/about-white.png', 'icons/about-black.png'),
    label: text.menu.fileSubmenu.projectMetadata,
    click: () => {
      if (isFileLoaded(getGlobalBackendState())) {
        webContents.send(AllowedFrontendChannels.ShowProjectMetadataPopup, {
          showProjectMetadataPopup: true,
        });
      }
    },
    id: DisabledMenuItemHandler.registerDisabledMenuItem(),
    enabled: false,
  };
}

function getProjectStatistics(
  webContents: WebContents,
): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/statictics-white.png',
      'icons/statictics-black.png',
    ),
    label: text.menu.fileSubmenu.projectStatistics,
    click: () => {
      if (isFileLoaded(getGlobalBackendState())) {
        webContents.send(AllowedFrontendChannels.ShowProjectStatisticsPopup, {
          showProjectStatisticsPopup: true,
        });
      }
    },
    id: DisabledMenuItemHandler.registerDisabledMenuItem(),
    enabled: false,
  };
}

function getSetBaseUrl(mainWindow: BrowserWindow): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/restore-white.png',
      'icons/restore-black.png',
    ),
    label: text.menu.fileSubmenu.setBaseURL,
    click: selectBaseURLListener(mainWindow),
  };
}

function getQuit() {
  return {
    icon: getIconBasedOnTheme('icons/quit-white.png', 'icons/quit-black.png'),
    label: text.menu.fileSubmenu.quit,
    accelerator: 'CmdOrCtrl+Q',
    click: () => {
      app.quit();
    },
  };
}

function getExportFollowUp(
  webContents: WebContents,
): MenuItemConstructorOptions {
  return {
    label: text.menu.fileSubmenu.exportSubmenu.followUp,
    icon: getIconBasedOnTheme(
      'icons/follow-up-white.png',
      'icons/follow-up-black.png',
    ),
    click: () => {
      setLoadingState(webContents, true);
      logger.info('Preparing data for follow-up export');
      webContents.send(
        AllowedFrontendChannels.ExportFileRequest,
        ExportType.FollowUp,
      );
    },
    id: DisabledMenuItemHandler.registerDisabledMenuItem(),
    enabled: false,
  };
}

function getExportCompactBom(
  webContents: WebContents,
): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/com-list-white.png',
      'icons/com-list-black.png',
    ),
    label: text.menu.fileSubmenu.exportSubmenu.compactComponentList,
    click: () => {
      setLoadingState(webContents, true);
      logger.info('Preparing data for compact component list export');
      webContents.send(
        AllowedFrontendChannels.ExportFileRequest,
        ExportType.CompactBom,
      );
    },
    id: DisabledMenuItemHandler.registerDisabledMenuItem(),
    enabled: false,
  };
}

function getExportDetailedBom(
  webContents: WebContents,
): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme(
      'icons/det-list-white.png',
      'icons/det-list-black.png',
    ),
    label: text.menu.fileSubmenu.exportSubmenu.detailedComponentList,
    click: () => {
      setLoadingState(webContents, true);
      logger.info('Preparing data for detailed component list export');
      webContents.send(
        AllowedFrontendChannels.ExportFileRequest,
        ExportType.DetailedBom,
      );
    },
    id: DisabledMenuItemHandler.registerDisabledMenuItem(),
    enabled: false,
  };
}

function getExportSpdxYaml(
  webContents: WebContents,
): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme('icons/yaml-white.png', 'icons/yaml-black.png'),
    label: text.menu.fileSubmenu.exportSubmenu.spdxYAML,
    click: () => {
      setLoadingState(webContents, true);
      logger.info('Preparing data for SPDX (yaml) export');
      webContents.send(
        AllowedFrontendChannels.ExportFileRequest,
        ExportType.SpdxDocumentYaml,
      );
    },
    id: DisabledMenuItemHandler.registerDisabledMenuItem(),
    enabled: false,
  };
}

function getExportSpdxJson(
  webContents: WebContents,
): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme('icons/json-white.png', 'icons/json-black.png'),
    label: text.menu.fileSubmenu.exportSubmenu.spdxJSON,
    click: () => {
      setLoadingState(webContents, true);
      logger.info('Preparing data for SPDX (json) export');
      webContents.send(
        AllowedFrontendChannels.ExportFileRequest,
        ExportType.SpdxDocumentJson,
      );
    },
    id: DisabledMenuItemHandler.registerDisabledMenuItem(),
    enabled: false,
  };
}

function getExportSubMenu(
  webContents: WebContents,
): MenuItemConstructorOptions {
  return {
    label: text.menu.fileSubmenu.export,
    icon: getIconBasedOnTheme(
      'icons/export-white.png',
      'icons/export-black.png',
    ),
    submenu: [
      getExportFollowUp(webContents),
      getExportCompactBom(webContents),
      getExportDetailedBom(webContents),
      getExportSpdxYaml(webContents),
      getExportSpdxJson(webContents),
    ],
  };
}

export async function getFileMenu(
  mainWindow: BrowserWindow,
): Promise<MenuItemConstructorOptions> {
  const webContents = mainWindow.webContents;
  return {
    label: text.menu.file,
    submenu: [
      getOpenFile(mainWindow),
      await getOpenRecent(mainWindow),
      getImportFile(mainWindow),
      getMerge(mainWindow),
      getSaveFile(webContents),
      getExportSubMenu(webContents),
      getProjectMetadata(webContents),
      getProjectStatistics(webContents),
      getSetBaseUrl(mainWindow),
      ...(os.platform() === 'darwin' ? [] : [getQuit()]),
    ],
  };
}
