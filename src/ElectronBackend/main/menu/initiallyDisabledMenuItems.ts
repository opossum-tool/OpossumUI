// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Menu } from 'electron';

export const INITIALLY_DISABLED_ITEMS_IDS: Record<string, string> = {
  save: 'save',
  followUp: 'follow-up',
  compactComponentList: 'compact-list',
  detailedComponentList: 'detailed-list',
  spdxYAML: 'spdx-yaml',
  spdxJSON: 'spdx-json',
  projectMetadata: 'project-metadata',
  projectStatistics: 'project-statistics',
  selectAll: 'select-all',
  searchAttributions: 'search-attributions',
  searchSignals: 'search-signals',
  searchResourcesAll: 'search-resources-all',
  searchResourceLinked: 'search-resources-linked',
};

export function activateMenuItems(): void {
  const menu = Menu.getApplicationMenu();
  Object.values(INITIALLY_DISABLED_ITEMS_IDS).forEach((id) => {
    const menuItem = menu?.getMenuItemById(id);
    if (menuItem) {
      menuItem.enabled = true;
    }
  });
}
