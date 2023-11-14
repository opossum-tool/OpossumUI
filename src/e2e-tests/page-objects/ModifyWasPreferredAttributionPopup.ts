// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

export class ModifyWasPreferredAttributionPopup {
  private readonly window: Page;
  private readonly node: Locator;
  readonly cancelButton: Locator;
  readonly saveButton: Locator;
  readonly saveGloballyButton: Locator;

  constructor(window: Page) {
    this.window = window;
    this.node = window.getByLabel('modify was preferred attribution popup');
    this.cancelButton = this.node.getByRole('button', {
      name: 'Cancel',
      exact: true,
    });
    this.saveButton = this.node.getByRole('button', {
      name: 'Save',
      exact: true,
    });
    this.saveGloballyButton = this.node.getByRole('button', {
      name: 'Save globally',
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
  };

  async close(): Promise<void> {
    await this.window.keyboard.press('Escape');
  }
}
