// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';

export class ReportView {
  private readonly window: Page;
  private readonly node: Locator;
  readonly filterButton: Locator;
  readonly filters: {
    readonly thirdParty: Locator;
    readonly firstParty: Locator;
    readonly needsFollowUp: Locator;
    readonly needsReviewByQA: Locator;
    readonly preferred: Locator;
    readonly preSelected: Locator;
    readonly license: Locator;
  };

  constructor(window: Page) {
    this.window = window;
    this.node = window.getByLabel('report view');
    this.filterButton = this.node.getByLabel('filter button', { exact: true });
    this.filters = {
      thirdParty: window.getByRole('menuitem', {
        name: text.filters.thirdParty,
      }),
      firstParty: window.getByRole('menuitem', {
        name: text.filters.firstParty,
      }),
      needsFollowUp: window.getByRole('menuitem', {
        name: text.filters.needsFollowUp,
      }),
      needsReviewByQA: window.getByRole('menuitem', {
        name: text.filters.needsReview,
      }),
      preferred: window.getByRole('menuitem', {
        name: text.filters.currentlyPreferred,
      }),
      preSelected: window.getByRole('menuitem', {
        name: text.filters.preSelected,
      }),
      license: window.getByLabel('license names'),
    };
  }

  private attributionRow(id: string): Locator {
    return this.node.getByTestId(id);
  }

  public assert = {
    attributionIsVisible: async (id: string): Promise<void> => {
      await expect(this.attributionRow(id)).toBeVisible();
    },
    attributionIsHidden: async (id: string): Promise<void> => {
      await expect(this.attributionRow(id)).toBeHidden();
    },
  };

  async openAttributionInAuditView(id: string): Promise<void> {
    await this.attributionRow(id)
      .getByRole('button', { name: text.reportView.openInAuditView })
      .click();
  }

  async closeMenu() {
    await this.window.keyboard.press('Escape');
  }

  async selectLicenseName(licenseName: string) {
    await this.filters.license.fill(licenseName);
    await this.window.keyboard.press('ArrowUp');
    await this.window.keyboard.press('Enter');
  }
}
