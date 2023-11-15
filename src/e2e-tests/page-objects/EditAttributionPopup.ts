// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

export class EditAttributionPopup {
  private readonly node: Locator;
  readonly cancelButton: Locator;
  readonly saveButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('edit attribution popup');
    this.cancelButton = this.node.getByRole('button', {
      name: 'Cancel',
      exact: true,
    });
    this.saveButton = this.node.getByRole('button', {
      name: 'Save',
      exact: true,
    });
  }

  public assert = {
    isVisible: async (): Promise<void> => {
      await expect(this.node).toBeVisible();
    },
    isHidden: async (): Promise<void> => {
      await expect(this.node).toBeHidden();
    },
    saveButtonIsEnabled: async (): Promise<void> => {
      await expect(this.saveButton).toBeEnabled();
    },
    saveButtonIsDisabled: async (): Promise<void> => {
      await expect(this.saveButton).toBeDisabled();
    },
  };

  async close(): Promise<void> {
    await this.cancelButton.click();
  }
}
