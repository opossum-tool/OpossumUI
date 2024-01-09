// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { PackageCard } from './PackageCard';

export class AttributionList {
  private readonly node: Locator;
  readonly attributionCard: PackageCard;
  readonly filterButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('attribution list');
    this.attributionCard = new PackageCard(window, this.node);
    this.filterButton = this.node.getByLabel('Filter', { exact: true });
  }

  public assert = {
    isVisible: async (): Promise<void> => {
      await expect(this.node).toBeVisible();
    },
    isHidden: async (): Promise<void> => {
      await expect(this.node).toBeHidden();
    },
  };

  async toggleFiltersVisibility(): Promise<void> {
    await this.filterButton.click();
  }
}
