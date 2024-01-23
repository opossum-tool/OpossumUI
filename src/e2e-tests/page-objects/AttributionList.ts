// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';
import { PackageCard } from './PackageCard';

export class AttributionList {
  private readonly window: Page;
  private readonly node: Locator;
  readonly attributionCard: PackageCard;
  readonly confirmButton: Locator;
  readonly replaceButton: Locator;
  readonly deleteButton: Locator;
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
    this.node = window.getByLabel('attribution list');
    this.attributionCard = new PackageCard(this.node);
    this.confirmButton = this.node.getByLabel('confirm button', {
      exact: true,
    });
    this.replaceButton = this.node.getByLabel('replace button', {
      exact: true,
    });
    this.deleteButton = this.node.getByLabel('delete button', {
      exact: true,
    });
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

  public assert = {
    isVisible: async (): Promise<void> => {
      await expect(this.node).toBeVisible();
    },
    isHidden: async (): Promise<void> => {
      await expect(this.node).toBeHidden();
    },
  };

  async closeFilterMenu(): Promise<void> {
    await this.window.keyboard.press('Escape');
  }
}
