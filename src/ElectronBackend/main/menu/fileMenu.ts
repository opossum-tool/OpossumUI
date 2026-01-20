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
} from '../listeners';
import { ProcessingStatusUpdater } from '../ProcessingStatusUpdater';
import { UserSettingsService } from '../user-settings-service';

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
    enabled: !getGlobalBackendState().frontendPopupOpen,
  };
}

async function getOpenRecent(
  mainWindow: BrowserWindow,
  updateMenu: () => Promise<void>,
): Promise<MenuItemConstructorOptions> {
  const recentlyOpenedPaths = await UserSettingsService.get(
    'recentlyOpenedPaths',
  );

  const enabled =
    !!recentlyOpenedPaths?.length && !getGlobalBackendState().frontendPopupOpen;

  return {
    icon: getIconBasedOnTheme('icons/open-white.png', 'icons/open-black.png'),
    label: text.menu.fileSubmenu.openRecent,
    submenu: getOpenRecentSubmenu(
      mainWindow,
      recentlyOpenedPaths,
      enabled,
      updateMenu,
    ),
    enabled,
  };
}

function getOpenRecentSubmenu(
  mainWindow: BrowserWindow,
  recentlyOpenedPaths: Array<string> | null,
  enabled: boolean,
  updateMenu: () => Promise<void>,
): MenuItemConstructorOptions['submenu'] {
  if (!recentlyOpenedPaths?.length) {
    return undefined;
  }

  return [
    ...recentlyOpenedPaths.map<MenuItemConstructorOptions>((recentPath) => ({
      label: path.basename(recentPath, path.extname(recentPath)),
      click: ({ id }) => handleOpeningFile(mainWindow, id, updateMenu),
      id: recentPath,
      enabled,
    })),
    { type: 'separator' },
    {
      id: 'clear-recent',
      label: text.menu.fileSubmenu.clearRecent,
      click: async () => {
        await UserSettingsService.update(
          { recentlyOpenedPaths: [] },
          { skipNotification: true },
        );
        await updateMenu();
      },
      enabled,
    },
  ];
}

function getImportFile(mainWindow: BrowserWindow): MenuItemConstructorOptions {
  const enabled = !getGlobalBackendState().frontendPopupOpen;
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
      enabled,
    })),
    enabled,
  };
}

function getMerge(mainWindow: BrowserWindow): MenuItemConstructorOptions {
  const enabled =
    isFileLoaded(getGlobalBackendState()) &&
    !getGlobalBackendState().frontendPopupOpen;
  return {
    icon: getIconBasedOnTheme('icons/merge-white.png', 'icons/merge-black.png'),
    label: text.menu.fileSubmenu.merge,
    submenu: importFileFormats.map((fileFormat) => ({
      label: text.menu.fileSubmenu.mergeSubmenu(fileFormat),
      click: getMergeListener(mainWindow, fileFormat),
      id: `id-${fileFormat.name}`,
      enabled,
    })),
    enabled,
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
    enabled:
      isFileLoaded(getGlobalBackendState()) &&
      !getGlobalBackendState().frontendPopupOpen,
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
    enabled:
      isFileLoaded(getGlobalBackendState()) &&
      !getGlobalBackendState().frontendPopupOpen,
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
    enabled:
      isFileLoaded(getGlobalBackendState()) &&
      !getGlobalBackendState().frontendPopupOpen,
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
    enabled: !getGlobalBackendState().frontendPopupOpen,
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
      const processingStatusUpdater = new ProcessingStatusUpdater(webContents);
      processingStatusUpdater.startProcessing();
      processingStatusUpdater.info('Preparing data for follow-up export');
      webContents.send(
        AllowedFrontendChannels.ExportFileRequest,
        ExportType.FollowUp,
      );
    },
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
      const processingStatusUpdater = new ProcessingStatusUpdater(webContents);
      processingStatusUpdater.startProcessing();
      processingStatusUpdater.info(
        'Preparing data for compact component list export',
      );
      webContents.send(
        AllowedFrontendChannels.ExportFileRequest,
        ExportType.CompactBom,
      );
    },
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
      const processingStatusUpdater = new ProcessingStatusUpdater(webContents);
      processingStatusUpdater.startProcessing();
      processingStatusUpdater.info(
        'Preparing data for detailed component list export',
      );
      webContents.send(
        AllowedFrontendChannels.ExportFileRequest,
        ExportType.DetailedBom,
      );
    },
  };
}

function getExportSpdxYaml(
  webContents: WebContents,
): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme('icons/yaml-white.png', 'icons/yaml-black.png'),
    label: text.menu.fileSubmenu.exportSubmenu.spdxYAML,
    click: () => {
      const processingStatusUpdater = new ProcessingStatusUpdater(webContents);
      processingStatusUpdater.startProcessing();
      processingStatusUpdater.info('Preparing data for SPDX (yaml) export');
      webContents.send(
        AllowedFrontendChannels.ExportFileRequest,
        ExportType.SpdxDocumentYaml,
      );
    },
  };
}

function getExportSpdxJson(
  webContents: WebContents,
): MenuItemConstructorOptions {
  return {
    icon: getIconBasedOnTheme('icons/json-white.png', 'icons/json-black.png'),
    label: text.menu.fileSubmenu.exportSubmenu.spdxJSON,
    click: () => {
      const processingStatusUpdater = new ProcessingStatusUpdater(webContents);
      processingStatusUpdater.startProcessing();
      processingStatusUpdater.info('Preparing data for SPDX (json) export');
      webContents.send(
        AllowedFrontendChannels.ExportFileRequest,
        ExportType.SpdxDocumentJson,
      );
    },
  };
}

function getExportSubMenu(
  webContents: WebContents,
): MenuItemConstructorOptions {
  const enabled =
    isFileLoaded(getGlobalBackendState()) &&
    !getGlobalBackendState().frontendPopupOpen;
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
    ].map((i) => ({ ...i, enabled })),
    enabled,
  };
}

export async function getFileMenu(
  mainWindow: BrowserWindow,
  updateMenu: () => Promise<void>,
): Promise<MenuItemConstructorOptions> {
  const webContents = mainWindow.webContents;
  return {
    label: text.menu.file,
    submenu: [
      getOpenFile(mainWindow),
      await getOpenRecent(mainWindow, updateMenu),
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
