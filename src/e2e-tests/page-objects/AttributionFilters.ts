// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';

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
    this.node = window.getByLabel('attribution filters');
    this.hideFirstPartyOption = window.getByRole('option', {
      name: text.attributionFilters.thirdParty,
    });
    this.onlyFirstPartyOption = window.getByRole('option', {
      name: text.attributionFilters.firstParty,
    });
    this.onlyFollowUpOption = window.getByRole('option', {
      name: text.attributionFilters.followUp,
    });
    this.onlyNeedsReviewOption = window.getByRole('option', {
      name: text.attributionFilters.needsReview,
    });
    this.onlyPreferredOption = window.getByRole('option', {
      name: text.attributionFilters.currentlyPreferred,
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

  async openFilterMenu(): Promise<void> {
    await this.node.click();
  }

  async clearFilters(): Promise<void> {
    await this.node.getByLabel('clear button').click();
  }

  async closeFilterMenu(): Promise<void> {
    await this.window.keyboard.press('Escape');
  }
}
