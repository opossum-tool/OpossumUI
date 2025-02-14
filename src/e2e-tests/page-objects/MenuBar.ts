// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ElectronApplication, expect, Page } from '@playwright/test';
import { clickMenuItem } from 'electron-playwright-helpers';

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
    await clickMenuItem(this.window.app, 'label', 'Open File');
  }

  async openProjectStatistics(): Promise<void> {
    await clickMenuItem(this.window.app, 'label', 'Project Statistics');
  }

  async importLegacyOpossumFile(): Promise<void> {
    await clickMenuItem(
      this.window.app,
      'label',
      'Legacy Opossum File (.json/.json.gz)',
    );
  }

  async importScanCodeFile(): Promise<void> {
    await clickMenuItem(this.window.app, 'label', 'ScanCode File (.json)');
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
