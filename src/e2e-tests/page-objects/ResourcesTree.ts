// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';
import { Tree } from './tree';

export class ResourcesTree extends Tree {
  private readonly filterMenu: Locator;
  readonly filterButton: Locator;
  readonly filters: { readonly license: Locator; readonly unreviewed: Locator };

  constructor(window: Page) {
    super(window, 'resources-tree', 'resources-tree-header');
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
  }

  public assert = {
    ...this.treeAssertions,
    resourceCountIs: async (count: number): Promise<void> =>
      expect(this.header).toContainText(`Resources (${count} / ${count})`),
    splitHereIsDisabled: async (name: string): Promise<void> => {
      await this.openContextMenu(name);
      await expect(
        this.window.getByRole('menuitem', {
          name: text.resourceBrowser.splitHere,
        }),
      ).toBeDisabled();
      await this.closeMenu();
    },
  };

  async openContextMenu(name: string): Promise<void> {
    await this.getResourceByName(name).click({ button: 'right' });
  }
  async openSplitDialog(name: string): Promise<void> {
    await this.openContextMenu(name);
    await this.window
      .getByRole('menuitem', { name: text.resourceBrowser.splitHere })
      .click();
  }
  async openSplitDialogAtPath(path: string): Promise<void> {
    await this.revealResource(path);
    await this.getResourceByPath(path).click({ button: 'right' });
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
    const expected = selected.toString();
    if (
      (await this.filters.unreviewed.getAttribute('aria-selected')) !== expected
    ) {
      await this.filters.unreviewed.click();
    }
    await expect(this.filters.unreviewed).toHaveAttribute(
      'aria-selected',
      expected,
    );
    await this.closeMenu();
  }
  async selectLicenseName(name: string): Promise<void> {
    await this.filters.license.fill(name);
    await this.window.getByRole('option', { name, exact: true }).click();
    await expect(this.filters.license).toHaveValue(name);
  }
}
