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
  readonly replaceButton: Locator;
  readonly deleteButton: Locator;
  readonly filterButton: Locator;
  readonly filters: {
    readonly thirdParty: Locator;
    readonly firstParty: Locator;
    readonly needsFollowUp: Locator;
    readonly needsReviewByQA: Locator;
    readonly preferred: Locator;
  };

  constructor(window: Page) {
    this.window = window;
    this.node = window.getByLabel('attribution list');
    this.attributionCard = new PackageCard(window, this.node);
    this.replaceButton = this.node.getByLabel('replace button', {
      exact: true,
    });
    this.deleteButton = this.node.getByLabel('delete button', {
      exact: true,
    });
    this.filterButton = this.node.getByLabel('filter button', { exact: true });
    this.filters = {
      thirdParty: window.getByRole('menuitem', {
        name: text.attributionFilters.thirdParty,
      }),
      firstParty: window.getByRole('menuitem', {
        name: text.attributionFilters.firstParty,
      }),
      needsFollowUp: window.getByRole('menuitem', {
        name: text.attributionFilters.needsFollowUp,
      }),
      needsReviewByQA: window.getByRole('menuitem', {
        name: text.attributionFilters.needsReview,
      }),
      preferred: window.getByRole('menuitem', {
        name: text.attributionFilters.currentlyPreferred,
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
