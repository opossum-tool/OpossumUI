// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

export class ResourcePathPopup {
  private readonly node: Locator;
  readonly title: Locator;
  readonly closeButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('resource path');
    this.title = this.node.getByText('Resources for selected');
    this.closeButton = this.node.getByRole('button', { name: 'close' });
  }

  public assert = {
    titleIsVisible: async (): Promise<void> => {
      await expect(this.title).toBeVisible();
    },
    titleIsHidden: async (): Promise<void> => {
      await expect(this.title).toBeHidden();
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

  async close(): Promise<void> {
    await this.closeButton.click();
  }

  async gotoRoot(): Promise<void> {
    await this.node.getByText('/', { exact: true }).click();
  }

  async goto(resourceName: string): Promise<void> {
    await this.node.getByText(resourceName, { exact: true }).click();
  }
}
