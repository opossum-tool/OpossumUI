// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { UserSettings } from './shared-types';

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
