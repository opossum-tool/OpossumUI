// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type ElementHandle,
  expect,
  type Locator,
  type Page,
} from '@playwright/test';

import { text } from '../../shared/text';

export class ResourcesTree {
  private readonly window: Page;
  private readonly node: Locator;
  private readonly header: Locator;
  private readonly filterMenu: Locator;
  readonly filterButton: Locator;
  readonly filters: {
    readonly license: Locator;
    readonly unreviewed: Locator;
  };
  readonly searchField: Locator;
  readonly clearSearchButton: Locator;

  constructor(window: Page) {
    this.window = window;
    this.node = window.getByTestId('resources-tree');
    this.header = window.getByTestId('resources-tree-header');
    this.filterButton = this.header.getByLabel('filter button', {
      exact: true,
    });
    this.filters = {
      license: window.getByLabel('license names'),
      unreviewed: window.getByRole('menuitem', {
        name: text.filters.unreviewed,
      }),
    };
    this.filterMenu = window.getByRole('menu');
    this.searchField = this.header.getByRole('searchbox');
    this.clearSearchButton = this.header.getByLabel('clear search');
  }

  public assert = {
    isVisible: async (timeout?: number): Promise<void> => {
      await expect(this.node).toBeVisible({ timeout });
    },
    isHidden: async (): Promise<void> => {
      await expect(this.node).toBeHidden();
    },
    resourceIsVisible: async (resourceName: string): Promise<void> => {
      await expect(this.getResourceByName(resourceName)).toBeVisible();
    },
    resourceIsEditable: async (resourceName: string): Promise<void> => {
      await expect(
        this.getResourceByName(resourceName).getByTestId('readonly-indicator'),
      ).toBeHidden();
    },
    resourceIsReadonly: async (resourceName: string): Promise<void> => {
      await expect(
        this.getResourceByName(resourceName).getByTestId('readonly-indicator'),
      ).toBeVisible();
    },
    resourceIsHidden: async (resourceName: string): Promise<void> => {
      await expect(this.getResourceByName(resourceName)).toBeHidden();
    },
    splitHereIsDisabled: async (resourceName: string): Promise<void> => {
      await this.openContextMenu(resourceName);
      await expect(
        this.window.getByRole('menuitem', {
          name: text.resourceBrowser.splitHere,
        }),
      ).toBeDisabled();
      await this.closeMenu();
    },
  };

  private getResourceByName(resourceName: string): Locator {
    return this.node.getByRole('treeitem', { name: resourceName, exact: true });
  }

  async getElementHandle(): Promise<ElementHandle | undefined> {
    const [elementHandle] = await this.node.elementHandles();
    return elementHandle;
  }

  async gotoRoot(): Promise<void> {
    await this.node.getByText('/', { exact: true }).click();
  }

  async goto(...resourceNames: Array<string>): Promise<void> {
    for (const resourceName of resourceNames) {
      await this.node.getByText(resourceName, { exact: true }).click();
    }
  }

  async openContextMenu(resourceName: string): Promise<void> {
    await this.node
      .getByText(resourceName, { exact: true })
      .click({ button: 'right' });
  }

  async openSplitDialog(resourceName: string): Promise<void> {
    await this.openContextMenu(resourceName);
    await this.window
      .getByRole('menuitem', { name: text.resourceBrowser.splitHere })
      .click();
  }

  async closeMenu(): Promise<void> {
    if (await this.filterMenu.isVisible()) {
      await this.filterMenu.press('Escape');
    }
  }

  async selectLicenseName(licenseName: string): Promise<void> {
    await this.filters.license.fill(licenseName);
    await this.window
      .getByRole('option', { name: licenseName, exact: true })
      .click();
    await expect(this.filters.license).toHaveValue(licenseName);
  }
}
