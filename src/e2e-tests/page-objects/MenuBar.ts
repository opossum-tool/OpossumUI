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
  };

  async openProjectMetadata(): Promise<void> {
    await clickMenuItem(this.window.app, 'label', 'Project Metadata');
  }

  async openFile(): Promise<void> {
    await clickMenuItem(this.window.app, 'label', 'Open...');
  }

  private async clickSubmenuItem(
    submenuLabel: string,
    itemLabel: string,
  ): Promise<void> {
    const submenu = (await findMenuItem(this.window.app, 'label', submenuLabel))
      ?.submenu;
    const menuItem = await findMenuItem(
      this.window.app,
      'label',
      itemLabel,
      submenu,
    );
    if (menuItem?.id) {
      await clickMenuItemById(this.window.app, menuItem.id);
    }
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
