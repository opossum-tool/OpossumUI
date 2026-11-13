// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';

export class ReportView {
  private readonly window: Page;
  private readonly node: Locator;
  private readonly filterMenu: Locator;
  readonly filterButton: Locator;
  readonly filters: {
    readonly thirdParty: Locator;
    readonly firstParty: Locator;
    readonly needsFollowUp: Locator;
    readonly needsReviewByQA: Locator;
    readonly preferred: Locator;
    readonly preSelected: Locator;
  };

  constructor(window: Page) {
    this.window = window;
    this.node = window.getByLabel('report view');
    this.filterMenu = window.getByRole('menu');
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
    };
  }

  private attributionRow(id: string): Locator {
    return this.node.getByTestId(id);
  }

  public assert = {
    isVisible: async (): Promise<void> => {
      await expect(this.node).toBeVisible();
    },
    attributionIsVisible: async (id: string): Promise<void> => {
      await expect(this.attributionRow(id)).toBeVisible();
    },
    attributionIsInViewport: async (id: string): Promise<void> => {
      await expect(this.attributionRow(id)).toBeInViewport();
    },
    attributionIsEditable: async (id: string): Promise<void> => {
      await expect(this.attributionRow(id)).toBeVisible();
    },
    attributionIsHidden: async (id: string): Promise<void> => {
      await expect(this.attributionRow(id)).toBeHidden();
    },
    attributionIsReadonly: async (id: string): Promise<void> => {
      await expect(this.attributionRow(id)).toBeHidden();
    },
  };

  async openAttributionInAuditView(id: string): Promise<void> {
    await this.attributionRow(id)
      .getByRole('button', { name: text.reportView.openInAuditView })
      .click();
  }

  async scrollToTop(): Promise<void> {
    await this.node.evaluate((scroller) => {
      scroller.scrollTop = 0;
    });
  }

  async filterByLicense(licenseName: string) {
    await this.filterButton.click();
    await this.filterMenu.locator('[data-option-id="license"]').click();
    const editor = this.window.getByRole('dialog', {
      name: text.licenseEditor.title,
    });
    const search = editor.getByRole('textbox', {
      name: text.licenseEditor.search,
    });
    await search.fill(licenseName);
    const option = editor.getByRole('option', {
      name: licenseName,
      exact: true,
    });
    await option.click();
    await expect(option).toHaveAttribute('aria-selected', 'true');
    await search.press('Escape');
    await this.filterMenu.press('Escape');
    await expect(this.filterMenu).toBeHidden();
  }
}
