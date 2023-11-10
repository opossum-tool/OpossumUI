// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

export class AttributionFilters {
  private readonly window: Page;
  private readonly node: Locator;
  readonly hideFirstPartyOption: Locator;
  readonly onlyFirstPartyOption: Locator;
  readonly onlyFollowUpOption: Locator;
  readonly onlyNeedsReviewOption: Locator;
  readonly onlyPreferredOption: Locator;

  constructor(window: Page) {
    this.window = window;
    this.node = window.getByRole('combobox');
    this.hideFirstPartyOption = window
      .getByRole('listbox')
      .getByLabel('hide first party');
    this.onlyFirstPartyOption = window
      .getByRole('listbox')
      .getByLabel('only first party');
    this.onlyFollowUpOption = window
      .getByRole('listbox')
      .getByLabel('only follow up');
    this.onlyNeedsReviewOption = window
      .getByRole('listbox')
      .getByLabel('only needs review');
    this.onlyPreferredOption = window
      .getByRole('listbox')
      .getByLabel('only preferred');
  }

  public assert = {
    isVisible: async (): Promise<void> => {
      await expect(this.node).toBeVisible();
    },
    isHidden: async (): Promise<void> => {
      await expect(this.node).toBeHidden();
    },
  };

  async openFilterMenu(): Promise<void> {
    await this.node.click();
  }

  async closeFilterMenu(): Promise<void> {
    await this.window.keyboard.press('Escape');
  }
}
