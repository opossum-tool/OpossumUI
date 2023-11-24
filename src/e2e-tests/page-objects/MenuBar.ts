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

  async openProjectStatistics(): Promise<void> {
    await clickMenuItem(this.window.app, 'label', 'Project Statistics');
  }

  async locateSignals(): Promise<void> {
    await clickMenuItem(this.window.app, 'label', 'Locate Signals');
  }

  async searchForFilesAndDirectories(): Promise<void> {
    await clickMenuItem(
      this.window.app,
      'label',
      'Search for Files and Directories',
    );
  }

  async toggleQaMode(): Promise<void> {
    await clickMenuItem(this.window.app, 'label', 'QA Mode');
  }

  async saveChanges(): Promise<void> {
    await clickMenuItem(this.window.app, 'label', 'Save');
  }
}
