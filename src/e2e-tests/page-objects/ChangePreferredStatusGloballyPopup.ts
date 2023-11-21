// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';

export class ChangePreferredStatusGloballyPopup {
  private readonly window: Page;
  private readonly node: Locator;
  readonly okButton: Locator;
  readonly cancelButton: Locator;

  constructor(window: Page) {
    this.window = window;
    this.node = window.getByLabel('change preferred status globally popup');
    this.okButton = this.node.getByRole('button', {
      name: 'Ok',
      exact: true,
    });
    this.cancelButton = this.node.getByRole('button', {
      name: 'Cancel',
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
    markAsPreferredWarningIsVisible: async (): Promise<void> => {
      await expect(
        this.node.getByText(
          text.changePreferredStatusGloballyPopup.markAsPreferred,
        ),
      ).toBeVisible();
    },
    unmarkAsPreferredWarningIsVisible: async (): Promise<void> => {
      await expect(
        this.node.getByText(
          text.changePreferredStatusGloballyPopup.unmarkAsPreferred,
        ),
      ).toBeVisible();
    },
  };

  async close(): Promise<void> {
    await this.window.keyboard.press('Escape');
  }
}
