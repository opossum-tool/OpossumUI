// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ElectronApplication, expect, Page } from '@playwright/test';
import {
  clickMenuItem,
  clickMenuItemById,
  findMenuItem,
} from 'electron-playwright-helpers';

import { importFileFormats } from '../../ElectronBackend/main/menu/fileMenu';
import { text } from '../../shared/text';

const initiallyDisabledMenuItems = [
  text.menu.fileSubmenu.projectStatistics,
  text.menu.fileSubmenu.projectMetadata,
  text.menu.fileSubmenu.save,
  text.menu.editSubmenu.selectAll,
  text.menu.editSubmenu.searchAttributions,
  text.menu.editSubmenu.searchSignals,
  text.menu.editSubmenu.searchResourceLinked,
  text.menu.editSubmenu.searchResourcesAll,
  text.menu.fileSubmenu.merge,
  text.menu.fileSubmenu.export,
];

const popupDisabledMenuItems = [
  text.menu.fileSubmenu.open,
  text.menu.fileSubmenu.openRecent,
  text.menu.fileSubmenu.import,
  text.menu.fileSubmenu.merge,
  text.menu.fileSubmenu.save,
  text.menu.fileSubmenu.export,
  text.menu.fileSubmenu.projectMetadata,
  text.menu.fileSubmenu.projectStatistics,
  text.menu.fileSubmenu.setBaseURL,
  text.menu.editSubmenu.undo,
  text.menu.editSubmenu.redo,
  text.menu.editSubmenu.searchAttributions,
  text.menu.editSubmenu.searchSignals,
  text.menu.editSubmenu.searchResourcesAll,
  text.menu.editSubmenu.searchResourceLinked,
  text.menu.helpSubmenu.checkForUpdates,
];

export class MenuBar {
  private readonly window: Page & { app: ElectronApplication };

  constructor(window: Page & { app: ElectronApplication }) {
    this.window = window;
  }

  private findByLabel(label: string) {
    return findMenuItem(this.window.app, 'label', label);
  }

  private async findSubmenuItem(menuLabel: string, itemLabel: string) {
    const menuItem = await this.findByLabel(menuLabel);
    return findMenuItem(this.window.app, 'label', itemLabel, menuItem?.submenu);
  }

  private readonly menuItemGetters = {
    openRecent: () => {
      return this.findByLabel(text.menu.fileSubmenu.openRecent);
    },
  };

  private clickMenuItem(label: string) {
    return clickMenuItem(this.window.app, 'label', label);
  }

  private async assertMenuItemEnabledState(label: string, enabled: boolean) {
    const menuItem = await this.findByLabel(label);
    expect(
      menuItem!.enabled,
      `Expected menu item ${label} to be ${enabled ? 'enabled' : 'disabled'}`,
    ).toBe(enabled);

    // If the menu item is disabled and has a sub menu, all the sub menu items should be disabled as well
    if (!enabled && menuItem?.submenu) {
      console.log(menuItem);
      for (const item of menuItem.submenu) {
        if (item.type !== 'separator') {
          expect(item.enabled).toBe(false);
        }
      }
    }
  }

  private async assertMenuItemsEnabledState(
    labels: Array<string>,
    enabled: boolean,
  ) {
    for (const label of labels) {
      await this.assertMenuItemEnabledState(label, enabled);
    }
  }

  private async assertSubMenuItemEnabledState(
    menuLabel: string,
    itemLabel: string,
    enabled: boolean,
  ) {
    const submenuItem = await this.findSubmenuItem(menuLabel, itemLabel);
    expect(
      submenuItem!.enabled,
      `Expected submenu item ${menuLabel}->${itemLabel} to be ${enabled ? 'enabled' : 'disabled'}`,
    ).toBe(enabled);
  }

  public assert = {
    hasTitle: async (title: string): Promise<void> => {
      expect(await this.window.title()).toBe(title);
    },
    openRecentIsEnabled: async (): Promise<void> => {
      await this.assertMenuItemEnabledState(
        text.menu.fileSubmenu.openRecent,
        true,
      );
    },
    openRecentIsDisabled: async (): Promise<void> => {
      await this.assertMenuItemEnabledState(
        text.menu.fileSubmenu.openRecent,
        false,
      );
    },
    initiallyDisabledEntriesAreEnabled: async (): Promise<void> => {
      await this.assertMenuItemsEnabledState(initiallyDisabledMenuItems, true);

      //need to call the asserts sequentially here, doing that in
      //parallel via promise all somehow breaks the app object
      for (const fileFormat of importFileFormats) {
        await this.assertSubMenuItemEnabledState(
          text.menu.fileSubmenu.merge,
          text.menu.fileSubmenu.mergeSubmenu(fileFormat),
          true,
        );
      }
      for (const subMenuItem of Object.values(
        text.menu.fileSubmenu.exportSubmenu,
      )) {
        await this.assertSubMenuItemEnabledState(
          text.menu.fileSubmenu.export,
          subMenuItem,
          true,
        );
      }
    },
    initiallyDisabledEntriesAreDisabled: async (): Promise<void> => {
      await this.assertMenuItemsEnabledState(initiallyDisabledMenuItems, false);
    },
    popupDisabledEntriesAreEnabled: async (): Promise<void> => {
      await this.assertMenuItemsEnabledState(popupDisabledMenuItems, true);
    },
    popupDisabledEntriesAreDisabled: async (): Promise<void> => {
      await this.assertMenuItemsEnabledState(popupDisabledMenuItems, false);
    },

    hasRecentlyOpenedProject: async (projectName: string): Promise<void> => {
      const submenu = (await this.menuItemGetters.openRecent())?.submenu;
      const menuItem = await findMenuItem(
        this.window.app,
        'label',
        projectName,
        submenu,
      );
      expect(menuItem).toBeDefined();
    },
  };

  async openProjectMetadata(): Promise<void> {
    await this.clickMenuItem(text.menu.fileSubmenu.projectMetadata);
  }

  async openFile(): Promise<void> {
    await this.clickMenuItem(text.menu.fileSubmenu.open);
  }

  private async clickSubmenuItem(
    menuLabel: string,
    submenuLabel: string,
  ): Promise<void> {
    const submenu = (await findMenuItem(this.window.app, 'label', menuLabel))!
      .submenu;
    const menuItem = await findMenuItem(
      this.window.app,
      'label',
      submenuLabel,
      submenu,
    );
    expect(menuItem?.enabled).toBe(true);
    await clickMenuItemById(this.window.app, menuItem!.id!);
  }

  async openProjectStatistics(): Promise<void> {
    await this.clickMenuItem(text.menu.fileSubmenu.projectStatistics);
  }

  async importLegacyOpossumFile(): Promise<void> {
    await this.clickSubmenuItem(
      text.menu.fileSubmenu.import,
      'Legacy Opossum File (.json/.json.gz)...',
    );
  }

  async importScanCodeFile(): Promise<void> {
    await this.clickSubmenuItem('Import', 'ScanCode File (.json)...');
  }

  async importOwaspDependencyScanFile(): Promise<void> {
    await this.clickSubmenuItem(
      text.menu.fileSubmenu.import,
      'OWASP Dependency-Check File (.json)...',
    );
  }

  async mergeLegacyOpossumFile(): Promise<void> {
    await this.clickSubmenuItem(
      text.menu.fileSubmenu.merge,
      'Legacy Opossum File (.json/.json.gz)...',
    );
  }

  async mergeScanCodeFile(): Promise<void> {
    await this.clickSubmenuItem(
      text.menu.fileSubmenu.merge,
      'ScanCode File (.json)...',
    );
  }

  async mergeOwaspDependencyScanFile(): Promise<void> {
    await this.clickSubmenuItem(
      text.menu.fileSubmenu.merge,
      'OWASP Dependency-Check File (.json)...',
    );
  }

  async exportFollowUp(): Promise<void> {
    await this.clickMenuItem(text.menu.fileSubmenu.exportSubmenu.followUp);
  }

  async toggleQaMode(): Promise<void> {
    await this.clickMenuItem(text.menu.viewSubmenu.qaMode);
  }

  async toggleShowClassificationOff(): Promise<void> {
    await clickMenuItemById(this.window.app, 'enabled-show-classifications');
  }

  async toggleShowCriticalityOff(): Promise<void> {
    await clickMenuItemById(this.window.app, 'enabled-show-criticality');
  }

  async saveChanges(): Promise<void> {
    await this.clickMenuItem(text.menu.fileSubmenu.save);
  }
}
