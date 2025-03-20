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

export class MenuBar {
  private readonly window: Page & { app: ElectronApplication };

  constructor(window: Page & { app: ElectronApplication }) {
    this.window = window;
  }

  public assert = {
    hasTitle: async (title: string): Promise<void> => {
      expect(await this.window.title()).toBe(title);
    },
    openRecentIsEnabled: async (): Promise<void> => {
      const menuItem = await findMenuItem(
        this.window.app,
        'label',
        'Open Recent',
      );
      expect(menuItem!.enabled).toBe(true);
    },
    openRecentIsDisabled: async (): Promise<void> => {
      const menuItem = await findMenuItem(
        this.window.app,
        'label',
        'Open Recent',
      );
      expect(menuItem!.enabled).toBe(false);
    },
    hasRecentlyOpenedProject: async (projectName: string): Promise<void> => {
      const submenu = (
        await findMenuItem(this.window.app, 'label', 'Open Recent')
      )?.submenu;
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
    await clickMenuItem(this.window.app, 'label', 'Project Metadata');
  }

  async openFile(): Promise<void> {
    await clickMenuItem(this.window.app, 'label', 'Open...');
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
    await clickMenuItemById(this.window.app, menuItem!.id);
  }

  async openProjectStatistics(): Promise<void> {
    await clickMenuItem(this.window.app, 'label', 'Project Statistics');
  }

  async importLegacyOpossumFile(): Promise<void> {
    await this.clickSubmenuItem(
      'Import',
      'Legacy Opossum File (.json/.json.gz)...',
    );
  }

  async importScanCodeFile(): Promise<void> {
    await this.clickSubmenuItem('Import', 'ScanCode File (.json)...');
  }

  async importOwaspDependencyScanFile(): Promise<void> {
    await this.clickSubmenuItem(
      'Import',
      'OWASP Dependency-Check File (.json)...',
    );
  }

  async mergeLegacyOpossumFile(): Promise<void> {
    await this.clickSubmenuItem(
      'Merge',
      'Legacy Opossum File (.json/.json.gz)...',
    );
  }

  async mergeScanCodeFile(): Promise<void> {
    await this.clickSubmenuItem('Merge', 'ScanCode File (.json)...');
  }

  async mergeOwaspDependencyScanFile(): Promise<void> {
    await this.clickSubmenuItem(
      'Merge',
      'OWASP Dependency-Check File (.json)...',
    );
  }

  async exportFollowUp(): Promise<void> {
    await clickMenuItem(this.window.app, 'label', 'Follow-Up');
  }

  async toggleQaMode(): Promise<void> {
    await clickMenuItem(this.window.app, 'label', 'QA Mode');
  }

  async saveChanges(): Promise<void> {
    await clickMenuItem(this.window.app, 'label', 'Save');
  }
}
