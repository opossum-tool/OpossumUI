// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Menu } from 'electron';

export const INITIALLY_DISABLED_MENU_ITEMS = [
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

export const INITIALLY_DISABLED_ITEMS_INFO: Record<
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
