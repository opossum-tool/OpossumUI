// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

export class ConfirmationPopup {
  private readonly node: Locator;
  readonly cancelButton: Locator;
  readonly confirmButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('confirmation popup');
    this.cancelButton = this.node.getByRole('button', { name: 'Cancel' });
    this.confirmButton = this.node.getByRole('button', { name: 'Confirm' });
  }

  public assert = {
    isVisible: async (): Promise<void> => {
      await expect(this.node).toBeVisible();
    },
    isHidden: async (): Promise<void> => {
      await expect(this.node).toBeHidden();
    },
    hasText: async (text: string): Promise<void> => {
      await expect(this.node.getByText(text)).toBeVisible();
    },
  };

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }
}
