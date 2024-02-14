// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

export class ResourcesTree {
  private readonly node: Locator;
  private readonly header: Locator;
  readonly searchField: Locator;
  readonly clearSearchButton: Locator;

  constructor(window: Page) {
    this.node = window.getByTestId('resources-tree');
    this.header = window.getByTestId('resources-tree-header');
    this.searchField = this.header.getByRole('searchbox');
    this.clearSearchButton = this.header.getByLabel('clear search');
  }

  public assert = {
    isVisible: async (): Promise<void> => {
      await expect(this.node).toBeVisible();
    },
    isHidden: async (): Promise<void> => {
      await expect(this.node).toBeHidden();
    },
    resourceIsVisible: async (resourceName: string): Promise<void> => {
      await expect(
        this.node.getByText(resourceName, { exact: true }),
      ).toBeVisible();
    },
    resourceIsHidden: async (resourceName: string): Promise<void> => {
      await expect(
        this.node.getByText(resourceName, { exact: true }),
      ).toBeHidden();
    },
  };

  async gotoRoot(): Promise<void> {
    await this.node.getByText('/', { exact: true }).click();
  }

  async goto(...resourceNames: Array<string>): Promise<void> {
    for (const resourceName of resourceNames) {
      await this.node.getByText(resourceName, { exact: true }).click();
    }
  }
}
