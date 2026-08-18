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
    resourceAtPathIsVisible: async (resourcePath: string): Promise<void> => {
      await expect(this.getResourceByPath(resourcePath)).toBeVisible();
    },
    resourceAtPathIsEditable: async (resourcePath: string): Promise<void> => {
      const resource = this.getResourceByPath(resourcePath);
      await expect(resource).toBeVisible();
      await expect(resource.getByTestId('readonly-indicator')).toBeHidden();
    },
    resourceAtPathIsReadonly: async (resourcePath: string): Promise<void> => {
      await expect(
        this.getResourceByPath(resourcePath).getByTestId('readonly-indicator'),
      ).toBeVisible();
    },
    searchIsFocused: async (): Promise<void> => {
      await expect(this.searchField).toBeFocused();
    },
    unreviewedFilterIsSelected: async (selected: boolean): Promise<void> => {
      await expect(this.filters.unreviewed).toHaveAttribute(
        'aria-selected',
        selected.toString(),
      );
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

  private getResourceByPath(resourcePath: string): Locator {
    const normalizedPath = resourcePath.replace(/\/$/, '');
    return this.node.locator(
      `[data-resource-path="${normalizedPath}"], ` +
        `[data-resource-path="${normalizedPath}/"]`,
    );
  }

  private getParentResourcePaths(resourcePath: string): Array<string> {
    const pathSegments = resourcePath.split('/').filter(Boolean);
    return pathSegments.slice(0, -1).map((_, index) => {
      return `/${pathSegments.slice(0, index + 1).join('/')}/`;
    });
  }

  async revealResource(resourcePath: string): Promise<void> {
    await this.gotoRoot();
    await this.searchField.fill(resourcePath);
    for (const parentResourcePath of this.getParentResourcePaths(
      resourcePath,
    )) {
      const parentResource = this.getResourceByPath(parentResourcePath);
      await expect(parentResource).toBeVisible();
      const normalizedPath = parentResourcePath.replace(/\/$/, '');
      const expandButton = parentResource
        .getByLabel(`expand ${parentResourcePath}`)
        .or(parentResource.getByLabel(`expand ${normalizedPath}`));
      if (await expandButton.isVisible()) {
        await expandButton.click();
      }
    }
    await expect(this.getResourceByPath(resourcePath)).toBeVisible();
  }

  async selectRevealedResource(resourcePath: string): Promise<void> {
    await this.getResourceByPath(resourcePath).click();
  }

  async clearSearch(): Promise<void> {
    if ((await this.searchField.inputValue()) !== '') {
      await this.clearSearchButton.click();
    }
    await expect(this.searchField).toHaveValue('');
  }

  async getElementHandle(): Promise<ElementHandle | undefined> {
    const [elementHandle] = await this.node.elementHandles();
    return elementHandle;
  }

  async gotoRoot(): Promise<void> {
    await this.window
      .getByLabel('path bar')
      .getByText('Home', { exact: true })
      .click();
  }

  async goto(...resourceNames: Array<string>): Promise<void> {
    for (const resourceName of resourceNames) {
      await this.node.getByText(resourceName, { exact: true }).click();
    }
  }

  async focusResource(resourceName: string): Promise<void> {
    await this.getResourceByName(resourceName).focus();
  }

  async gotoPath(resourceNames: ReadonlyArray<string>): Promise<void> {
    const firstResource = this.getResourceByName(resourceNames[0]);
    if (!(await firstResource.isVisible())) {
      await this.gotoRoot();
    }

    for (const [index, resourceName] of resourceNames.entries()) {
      const resource = this.getResourceByName(resourceName);
      await expect(resource).toBeVisible();
      const nextResourceName = resourceNames[index + 1];
      if (
        nextResourceName === undefined ||
        !(await this.getResourceByName(nextResourceName).isVisible())
      ) {
        await resource.click();
      }
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

  async openSplitDialogAtPath(resourcePath: string): Promise<void> {
    await this.revealResource(resourcePath);
    await this.getResourceByPath(resourcePath).click({ button: 'right' });
    await this.window
      .getByRole('menuitem', { name: text.resourceBrowser.splitHere })
      .click();
  }

  async closeMenu(): Promise<void> {
    if (await this.filterMenu.isVisible()) {
      await this.filterMenu.press('Escape');
    }
    await expect(this.filterMenu).toBeHidden();
  }

  async setUnreviewedFilter(selected: boolean): Promise<void> {
    if (!(await this.filterMenu.isVisible())) {
      await this.filterButton.click();
    }
    await expect(this.filterMenu).toBeVisible();
    const expectedValue = selected.toString();
    if (
      (await this.filters.unreviewed.getAttribute('aria-selected')) !==
      expectedValue
    ) {
      await this.filters.unreviewed.click();
    }
    await expect(this.filters.unreviewed).toHaveAttribute(
      'aria-selected',
      expectedValue,
    );
    await this.closeMenu();
  }

  async selectLicenseName(licenseName: string): Promise<void> {
    await this.filters.license.fill(licenseName);
    await this.window
      .getByRole('option', { name: licenseName, exact: true })
      .click();
    await expect(this.filters.license).toHaveValue(licenseName);
  }
}
