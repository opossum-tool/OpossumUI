// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type FileFormatInfo,
  FileType,
  type UserSettings,
} from './shared-types';

export const DEFAULT_PANEL_SIZES: NonNullable<UserSettings['panelSizes']> = {
  resourceBrowserWidth: 340,
  packageListsWidth: 360,
  linkedResourcesPanelHeight: null,
  signalsPanelHeight: null,
};

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

export const DEFAULT_USER_SETTINGS: UserSettings = {
  qaMode: false,
  showProjectStatistics: false,
  areHiddenSignalsVisible: false,
  showCriticality: true,
  showClassifications: true,
  panelSizes: DEFAULT_PANEL_SIZES,
  recentlyOpenedPaths: [],
  attributionTableOrdering: {
    orderDirection: 'asc',
    orderedColumn: 'NAME',
  },
};
