// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { UserSettings } from './shared-types';

export const OPOSSUM_UI_GITHUB_URL =
  'https://github.com/opossum-tool/OpossumUI';
export const LATEST_RELEASES_PAGE_URL = `${OPOSSUM_UI_GITHUB_URL}/releases/latest`;
export const OPOSSUM_UI_USER_GUIDE_URL = `${OPOSSUM_UI_GITHUB_URL}/blob/main/USER_GUIDE.md`;

export const DEFAULT_PANEL_SIZES: NonNullable<UserSettings['panelSizes']> = {
  resourceBrowserWidth: 340,
  packageListsWidth: 360,
  linkedResourcesPanelHeight: null,
  signalsPanelHeight: null,
};

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
