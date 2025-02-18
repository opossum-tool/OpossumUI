// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { app, BrowserWindow } from 'electron';

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
  importFileListener,
  getMergeListener,
  selectBaseURLListener,
  setLoadingState,
} from '../listeners';
import logger from '../logger';
import { DisabledMenuItemHandler } from './DisabledMenuItemHandler';

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
  {
    fileType: FileType.OWASP_JSON,
    name: 'OWASP Dependency-Check File',
    extensions: ['json'],
  },
];

function getOpenFile(mainWindow: Electron.CrossProcessExports.BrowserWindow) {
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

function getImportFile(mainWindow: Electron.CrossProcessExports.BrowserWindow) {
  return {
    icon: getIconBasedOnTheme(
      'icons/import-white.png',
      'icons/import-black.png',
    ),
    label: text.menu.fileSubmenu.import,
    submenu: importFileFormats.map((fileFormat) => ({
      label: text.menu.fileSubmenu.importSubmenu(fileFormat),
      click: importFileListener(mainWindow, fileFormat),
    })),
  };
}

function getMerge(mainWindow: Electron.CrossProcessExports.BrowserWindow) {
  return {
    icon: getIconBasedOnTheme(
      'icons/import-white.png',
      'icons/import-black.png',
    ),
    label: text.menu.fileSubmenu.merge,
    submenu: importFileFormats.map((fileFormat) => ({
      label: text.menu.fileSubmenu.mergeSubmenu(fileFormat),
      click: getMergeListener(mainWindow, fileFormat),
      id: DisabledMenuItemHandler.registerDisabledMenuItem(),
      enabled: false,
    })),
  };
}

function getSaveFile(webContents: Electron.WebContents) {
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

function getProjectMetadata(webContents: Electron.WebContents) {
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

function getProjectStatistics(webContents: Electron.WebContents) {
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

function getSetBaseUrl(mainWindow: Electron.CrossProcessExports.BrowserWindow) {
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

function getExportFollowUp(webContents: Electron.WebContents) {
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

function getExportCompactBom(webContents: Electron.WebContents) {
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

function getExportDetailedBom(webContents: Electron.WebContents) {
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

function getExportSpdxYaml(webContents: Electron.WebContents) {
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

function getExportSpdxJson(webContents: Electron.WebContents) {
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

function getExportSubMenu(webContents: Electron.WebContents) {
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

export function getFileMenu(mainWindow: BrowserWindow) {
  const webContents = mainWindow.webContents;
  return {
    label: text.menu.file,
    submenu: [
      getOpenFile(mainWindow),
      getImportFile(mainWindow),
      getMerge(mainWindow),
      getSaveFile(webContents),
      getExportSubMenu(webContents),
      getProjectMetadata(webContents),
      getProjectStatistics(webContents),
      getSetBaseUrl(mainWindow),
      getQuit(),
    ],
  };
}
