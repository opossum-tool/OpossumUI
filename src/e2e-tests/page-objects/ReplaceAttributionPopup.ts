// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

export class ReplaceAttributionPopup {
  private readonly node: Locator;
  readonly title: Locator;
  readonly cancelButton: Locator;
  readonly replaceButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('replace attribution popup');
    this.title = this.node.getByText('Replacing an attribution');
    this.cancelButton = this.node.getByRole('button', { name: 'Cancel' });
    this.replaceButton = this.node.getByRole('button', { name: 'Replace' });
  }

  public assert = {
    titleIsVisible: async (): Promise<void> => {
      await expect(this.title).toBeVisible();
    },
    titleIsHidden: async (): Promise<void> => {
      await expect(this.title).toBeHidden();
    },
  };

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async replace(): Promise<void> {
    await this.replaceButton.click();
  }
}
