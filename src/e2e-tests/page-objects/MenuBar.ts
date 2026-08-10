// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type ElectronApplication, expect, type Page } from '@playwright/test';
import {
  clickMenuItemById,
  getMenuItemAttribute,
  getMenuItemById,
} from 'electron-playwright-helpers';

import { menuItemIds } from '../../ElectronBackend/main/menu/menuItemIds';
import { stubOpenDialogSync } from '../utils/dialog';
import { ResourcesTree } from './ResourcesTree';

const initiallyDisabledMenuItems = [
  menuItemIds.projectStatistics,
  menuItemIds.projectMetadata,
  menuItemIds.saveFile,
  menuItemIds.selectAll,
  menuItemIds.searchAttributions,
  menuItemIds.searchSignals,
  menuItemIds.searchLinkedResources,
  menuItemIds.searchResources,
  menuItemIds.splitOpossumFile,
  menuItemIds.export,
  menuItemIds.exportFollowUp,
  menuItemIds.exportCompactBom,
  menuItemIds.exportDetailedBom,
  menuItemIds.exportSpdxYaml,
  menuItemIds.exportSpdxJson,
];

const popupDisabledMenuItems = [
  menuItemIds.openFile,
  menuItemIds.import,
  menuItemIds.importLegacyOpossumFile,
  menuItemIds.importScanCodeFile,
  menuItemIds.importOwaspDependencyCheckFile,
  menuItemIds.mergeOpossumFiles,
  menuItemIds.splitOpossumFile,
  menuItemIds.saveFile,
  menuItemIds.export,
  menuItemIds.exportFollowUp,
  menuItemIds.exportCompactBom,
  menuItemIds.exportDetailedBom,
  menuItemIds.exportSpdxYaml,
  menuItemIds.exportSpdxJson,
  menuItemIds.projectMetadata,
  menuItemIds.projectStatistics,
  menuItemIds.setBaseUrl,
  menuItemIds.undo,
  menuItemIds.redo,
  menuItemIds.searchAttributions,
  menuItemIds.searchSignals,
  menuItemIds.searchResources,
  menuItemIds.searchLinkedResources,
  menuItemIds.helpCheckForUpdates,
];

export class MenuBar {
  private readonly window: Page & { app: ElectronApplication };
  private readonly resourcesTree: ResourcesTree;

  constructor(window: Page & { app: ElectronApplication }) {
    this.window = window;
    this.resourcesTree = new ResourcesTree(window);
  }

  private async clickEnabledMenuItem(menuItemId: string): Promise<void> {
    await expect
      .poll(
        () => getMenuItemAttribute(this.window.app, menuItemId, 'enabled'),
        { message: `Expected menu item ${menuItemId} to be enabled` },
      )
      .toBe(true);
    await clickMenuItemById(this.window.app, menuItemId);
  }

  private async assertMenuItemEnabledState(
    menuItemId: string,
    enabled: boolean,
  ) {
    await expect
      .poll(
        () => getMenuItemAttribute(this.window.app, menuItemId, 'enabled'),
        {
          message: `Expected menu item ${menuItemId} to be ${enabled ? 'enabled' : 'disabled'}`,
        },
      )
      .toBe(enabled);
  }

  private async assertMenuItemsEnabledState(
    menuItemIds: Array<string>,
    enabled: boolean,
  ) {
    for (const menuItemId of menuItemIds) {
      await this.assertMenuItemEnabledState(menuItemId, enabled);
    }
  }

  public assert = {
    hasTitle: async (title: string): Promise<void> => {
      expect(await this.window.title()).toBe(title);
    },
    openRecentIsEnabled: async (): Promise<void> => {
      await this.assertMenuItemEnabledState(menuItemIds.openRecent, true);
    },
    openRecentIsDisabled: async (): Promise<void> => {
      await this.assertMenuItemEnabledState(menuItemIds.openRecent, false);
    },
    forceUnlockIsEnabled: async (): Promise<void> => {
      await this.assertMenuItemEnabledState(menuItemIds.forceUnlock, true);
    },
    forceUnlockIsDisabled: async (): Promise<void> => {
      await this.assertMenuItemEnabledState(menuItemIds.forceUnlock, false);
    },
    initiallyDisabledEntriesAreEnabled: async (): Promise<void> => {
      await this.assertMenuItemsEnabledState(initiallyDisabledMenuItems, true);

      await this.assertMenuItemsEnabledState(
        [
          menuItemIds.importLegacyOpossumFile,
          menuItemIds.importScanCodeFile,
          menuItemIds.importOwaspDependencyCheckFile,
        ],
        true,
      );
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

    hasRecentlyOpenedProject: async (filePath: string): Promise<void> => {
      const menuItem = await getMenuItemById(this.window.app, filePath);
      expect(menuItem).toBeDefined();
    },
  };

  async openProjectMetadata(): Promise<void> {
    await this.clickEnabledMenuItem(menuItemIds.projectMetadata);
  }

  async openFile(filePath?: string): Promise<void> {
    if (filePath) {
      await stubOpenDialogSync(this.window.app, [filePath]);
    }
    await this.clickEnabledMenuItem(menuItemIds.openFile);
  }

  async openFileAndWaitForLoad(filePath: string): Promise<void> {
    const previousResourcesTree = await this.resourcesTree.getElementHandle();

    await this.openFile(filePath);

    await previousResourcesTree?.waitForElementState('hidden', {
      timeout: 30000,
    });
    await this.resourcesTree.assert.isVisible(30000);
  }

  async createSplit(): Promise<void> {
    await this.clickEnabledMenuItem(menuItemIds.splitOpossumFile);
  }

  async openProjectStatistics(): Promise<void> {
    await this.clickEnabledMenuItem(menuItemIds.projectStatistics);
  }

  async importLegacyOpossumFile(): Promise<void> {
    await this.clickEnabledMenuItem(menuItemIds.importLegacyOpossumFile);
  }

  async importScanCodeFile(): Promise<void> {
    await this.clickEnabledMenuItem(menuItemIds.importScanCodeFile);
  }

  async importOwaspDependencyScanFile(): Promise<void> {
    await this.clickEnabledMenuItem(menuItemIds.importOwaspDependencyCheckFile);
  }

  async mergeSplitFilesIntoCurrentFile(): Promise<void> {
    await this.clickEnabledMenuItem(menuItemIds.mergeOpossumFiles);
  }

  async mergeSplitOpossumFiles(): Promise<void> {
    await this.clickEnabledMenuItem(menuItemIds.mergeOpossumFiles);
  }

  async exportFollowUp(): Promise<void> {
    await this.clickEnabledMenuItem(menuItemIds.exportFollowUp);
  }

  async toggleQaMode(): Promise<void> {
    await this.clickEnabledMenuItem(menuItemIds.qaMode);
  }

  async toggleShowClassificationOff(): Promise<void> {
    await this.clickEnabledMenuItem(menuItemIds.showClassifications);
  }

  async toggleShowCriticalityOff(): Promise<void> {
    await this.clickEnabledMenuItem(menuItemIds.showCriticality);
  }

  async saveChanges(): Promise<void> {
    await this.clickEnabledMenuItem(menuItemIds.saveFile);
  }

  async forceUnlock(): Promise<void> {
    await this.clickEnabledMenuItem(menuItemIds.forceUnlock);
  }
}
