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
import { isFileLoaded } from '../../utils/getLoadedFile';
import { getGlobalBackendState } from '../globalBackendState';
import { getIconBasedOnTheme } from '../iconHelpers';
import { getImportFileListener, getSelectBaseURLListener } from '../listeners';
import { INITIALLY_DISABLED_ITEMS_INFO } from './initiallyDisabledMenuItems';

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
    name: 'OWASP Dependency-Check',
    extensions: ['json'],
  },
];

function getOpenFile(mainWindow: Electron.CrossProcessExports.BrowserWindow) {
  return {
    icon: getIconBasedOnTheme('icons/open-white.png', 'icons/open-black.png'),
    label: 'Open File',
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
    label: 'Import File',
    submenu: importFileFormats.map((fileFormat) => ({
      label: `${fileFormat.name} (${fileFormat.extensions.map((ext) => `.${ext}`).join('/')})`,
      click: getImportFileListener(mainWindow, fileFormat),
    })),
  };
}

function getSaveFile(webContents: Electron.WebContents) {
  return {
    icon: getIconBasedOnTheme('icons/save-white.png', 'icons/save-black.png'),
    label: INITIALLY_DISABLED_ITEMS_INFO.save.label,
    accelerator: 'CmdOrCtrl+S',
    click: () => {
      webContents.send(AllowedFrontendChannels.SaveFileRequest, {
        saveFile: true,
      });
    },
    id: INITIALLY_DISABLED_ITEMS_INFO.save.id,
    enabled: false,
  };
}

function getProjectMetadata(webContents: Electron.WebContents) {
  return {
    icon: getIconBasedOnTheme('icons/about-white.png', 'icons/about-black.png'),
    label: INITIALLY_DISABLED_ITEMS_INFO.projectMetadata.label,
    click: () => {
      if (isFileLoaded(getGlobalBackendState())) {
        webContents.send(AllowedFrontendChannels.ShowProjectMetadataPopup, {
          showProjectMetadataPopup: true,
        });
      }
    },
    id: INITIALLY_DISABLED_ITEMS_INFO.projectMetadata.id,
    enabled: false,
  };
}

function getProjectStatistics(webContents: Electron.WebContents) {
  return {
    icon: getIconBasedOnTheme(
      'icons/statictics-white.png',
      'icons/statictics-black.png',
    ),
    label: INITIALLY_DISABLED_ITEMS_INFO.projectStatistics.label,
    click: () => {
      if (isFileLoaded(getGlobalBackendState())) {
        webContents.send(AllowedFrontendChannels.ShowProjectStatisticsPopup, {
          showProjectStatisticsPopup: true,
        });
      }
    },
    id: INITIALLY_DISABLED_ITEMS_INFO.projectStatistics.id,
    enabled: false,
  };
}

function getSetBaseUrl(mainWindow: Electron.CrossProcessExports.BrowserWindow) {
  return {
    icon: getIconBasedOnTheme(
      'icons/restore-white.png',
      'icons/restore-black.png',
    ),
    label: 'Set Path to Sources',
    click: () => {
      getSelectBaseURLListener(mainWindow)();
    },
  };
}

function getQuit() {
  return {
    icon: getIconBasedOnTheme('icons/quit-white.png', 'icons/quit-black.png'),
    label: 'Quit',
    accelerator: 'CmdOrCtrl+Q',
    click: () => {
      app.quit();
    },
  };
}

function getExportFollowUp(webContents: Electron.WebContents) {
  return {
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
  };
}

function getExportCompactBom(webContents: Electron.WebContents) {
  return {
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
  };
}

function getExportDetailedBom(webContents: Electron.WebContents) {
  return {
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
  };
}

function getExportSpdxYaml(webContents: Electron.WebContents) {
  return {
    icon: getIconBasedOnTheme('icons/yaml-white.png', 'icons/yaml-black.png'),
    label: INITIALLY_DISABLED_ITEMS_INFO.spdxYAML.label,
    click: () => {
      webContents.send(
        AllowedFrontendChannels.ExportFileRequest,
        ExportType.SpdxDocumentYaml,
      );
    },
    id: INITIALLY_DISABLED_ITEMS_INFO.spdxYAML.id,
    enabled: false,
  };
}

function getExportSpdsJson(webContents: Electron.WebContents) {
  return {
    icon: getIconBasedOnTheme('icons/json-white.png', 'icons/json-black.png'),
    label: INITIALLY_DISABLED_ITEMS_INFO.spdxJSON.label,
    click: () => {
      webContents.send(
        AllowedFrontendChannels.ExportFileRequest,
        ExportType.SpdxDocumentJson,
      );
    },
    id: INITIALLY_DISABLED_ITEMS_INFO.spdxJSON.id,
    enabled: false,
  };
}

function getExportSubMenu(webContents: Electron.WebContents) {
  return {
    label: 'Export',
    icon: getIconBasedOnTheme(
      'icons/export-white.png',
      'icons/export-black.png',
    ),
    submenu: [
      getExportFollowUp(webContents),
      getExportCompactBom(webContents),
      getExportDetailedBom(webContents),
      getExportSpdxYaml(webContents),
      getExportSpdsJson(webContents),
    ],
  };
}

export function getFileMenu(mainWindow: BrowserWindow) {
  const webContents = mainWindow.webContents;
  return {
    label: 'File',
    submenu: [
      getOpenFile(mainWindow),
      getImportFile(mainWindow),
      getSaveFile(webContents),
      getExportSubMenu(webContents),
      getProjectMetadata(webContents),
      getProjectStatistics(webContents),
      getSetBaseUrl(mainWindow),
      getQuit(),
    ],
  };
}
