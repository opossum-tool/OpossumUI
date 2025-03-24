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

  private async assertMenuItemDisabled(label: string) {
    const menuItem = await this.findByLabel(label);
    expect(
      menuItem!.enabled,
      `Expected menu item ${label}  to be disabled`,
    ).toBe(false);
  }

  private async assertMenuItemEnabled(label: string) {
    const menuItem = await this.findByLabel(label);
    expect(
      menuItem!.enabled,
      `Expected menu item ${label}  to be enabled`,
    ).toBe(true);
  }

  private async assertSubMenuItemDisabled(
    menuLabel: string,
    itemLabel: string,
  ) {
    const submenuItem = await this.findSubmenuItem(menuLabel, itemLabel);
    expect(
      submenuItem!.enabled,
      `Expected submenu item ${menuLabel}->${itemLabel}  to be disabled`,
    ).toBe(false);
  }

  private async assertSubMenuItemEnabled(menuLabel: string, itemLabel: string) {
    const submenuItem = await this.findSubmenuItem(menuLabel, itemLabel);
    expect(
      submenuItem!.enabled,
      `Expected submenu item ${menuLabel}->${itemLabel}  to be enabled`,
    ).toBe(true);
  }

  public assert = {
    hasTitle: async (title: string): Promise<void> => {
      expect(await this.window.title()).toBe(title);
    },
    openRecentIsEnabled: async (): Promise<void> => {
      await this.assertMenuItemEnabled(text.menu.fileSubmenu.openRecent);
    },
    openRecentIsDisabled: async (): Promise<void> => {
      await this.assertMenuItemDisabled(text.menu.fileSubmenu.openRecent);
    },
    initiallyDisableEntriesAreDisabled: async (): Promise<void> => {
      await this.assertMenuItemDisabled(text.menu.fileSubmenu.openRecent);
      await this.assertMenuItemDisabled(
        text.menu.fileSubmenu.projectStatistics,
      );
      await this.assertMenuItemDisabled(text.menu.fileSubmenu.projectMetadata);
      await this.assertMenuItemDisabled(text.menu.fileSubmenu.save);
      await this.assertMenuItemDisabled(text.menu.editSubmenu.selectAll);
      await this.assertMenuItemDisabled(
        text.menu.editSubmenu.searchAttributions,
      );
      await this.assertMenuItemDisabled(text.menu.editSubmenu.searchSignals);
      await this.assertMenuItemDisabled(
        text.menu.editSubmenu.searchResourceLinked,
      );
      await this.assertMenuItemDisabled(
        text.menu.editSubmenu.searchResourcesAll,
      );
      await Promise.all(
        importFileFormats.map((fileFormat) =>
          this.assertSubMenuItemDisabled(
            text.menu.fileSubmenu.merge,
            text.menu.fileSubmenu.mergeSubmenu(fileFormat),
          ),
        ),
      );
    },
    initiallyDisableEntriesAreEnabled: async (): Promise<void> => {
      await this.assertMenuItemEnabled(text.menu.fileSubmenu.openRecent);
      await this.assertMenuItemEnabled(text.menu.fileSubmenu.projectStatistics);
      await this.assertMenuItemEnabled(text.menu.fileSubmenu.projectMetadata);
      await this.assertMenuItemEnabled(text.menu.fileSubmenu.save);
      await this.assertMenuItemEnabled(text.menu.editSubmenu.selectAll);
      await this.assertMenuItemEnabled(
        text.menu.editSubmenu.searchAttributions,
      );
      await this.assertMenuItemEnabled(text.menu.editSubmenu.searchSignals);
      await this.assertMenuItemEnabled(
        text.menu.editSubmenu.searchResourceLinked,
      );
      await this.assertMenuItemEnabled(
        text.menu.editSubmenu.searchResourcesAll,
      );
      await Promise.all(
        importFileFormats.map((fileFormat) =>
          this.assertSubMenuItemEnabled(
            text.menu.fileSubmenu.merge,
            text.menu.fileSubmenu.mergeSubmenu(fileFormat),
          ),
        ),
      );
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
    await clickMenuItemById(this.window.app, menuItem!.id);
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

  async saveChanges(): Promise<void> {
    await this.clickMenuItem(text.menu.fileSubmenu.save);
  }
}
