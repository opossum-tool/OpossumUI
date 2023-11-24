// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { faker } from '../../shared/Faker';

export class FileSearchPopup {
  private readonly node: Locator;
  readonly title: Locator;
  readonly cancelButton: Locator;
  readonly searchInput: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('file search');
    this.title = this.node.getByText('Search for Files and Directories');
    this.cancelButton = this.node.getByRole('button', { name: 'cancel' });
    this.searchInput = this.node.getByLabel('Search', { exact: true });
  }

  public assert = {
    titleIsVisible: async (): Promise<void> => {
      await expect(this.title).toBeVisible();
    },
    titleIsHidden: async (): Promise<void> => {
      await expect(this.title).toBeHidden();
    },
    resourcePathIsVisible: async (
      ...elements: Array<string>
    ): Promise<void> => {
      await expect(
        this.node.getByText(faker.opossum.filePath(...elements), {
          exact: true,
        }),
      ).toBeVisible();
    },
    resourcePathIsHidden: async (...elements: Array<string>): Promise<void> => {
      await expect(
        this.node.getByText(faker.opossum.filePath(...elements), {
          exact: true,
        }),
      ).toBeHidden();
    },
  };

  async close(): Promise<void> {
    await this.cancelButton.click();
  }

  async gotoHit(...elements: Array<string>): Promise<void> {
    await this.node
      .getByText(faker.opossum.filePath(...elements), { exact: true })
      .click();
  }
}
