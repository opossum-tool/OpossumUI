// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

export class ErrorPopup {
  private readonly window: Page;
  private readonly node: Locator;
  readonly title: Locator;

  constructor(window: Page) {
    this.window = window;
    this.node = window.getByLabel('error popup');
    this.title = this.node.getByText('error');
  }

  public assert = {
    titleIsVisible: async (): Promise<void> => {
      await expect(this.title).toBeVisible();
    },
    titleIsHidden: async (): Promise<void> => {
      await expect(this.title).toBeHidden();
    },
    errorMessageIsVisible: async (errorMessage: string): Promise<void> => {
      await expect(this.node.getByText(errorMessage)).toBeVisible();
    },
  };

  async close(): Promise<void> {
    await this.window.keyboard.press('Escape');
  }
}
