// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';
import { PackageCard } from './PackageCard';

export class AttributionsPanel {
  private readonly window: Page;
  private readonly node: Locator;
  private readonly header: Locator;
  readonly packageCard: PackageCard;
  readonly selectAllCheckbox: Locator;
  readonly createButton: Locator;
  readonly linkButton: Locator;
  readonly confirmButton: Locator;
  readonly replaceButton: Locator;
  readonly deleteButton: Locator;
  readonly filterButton: Locator;
  readonly sortButton: Locator;
  readonly sortings: {
    readonly name: Locator;
    readonly criticality: Locator;
    readonly occurrence: Locator;
  };
  readonly filters: {
    readonly thirdParty: Locator;
    readonly firstParty: Locator;
    readonly needsFollowUp: Locator;
    readonly needsReviewByQA: Locator;
    readonly preferred: Locator;
    readonly preSelected: Locator;
    readonly license: Locator;
  };
  readonly tabs: {
    readonly onResource: Locator;
    readonly onChildren: Locator;
    readonly onParents: Locator;
    readonly unrelated: Locator;
  };
  readonly searchField: Locator;
  readonly clearSearchButton: Locator;

  constructor(window: Page) {
    this.window = window;
    this.node = window.getByTestId('attributions-panel');
    this.header = window.getByTestId('attributions-panel-header');
    this.packageCard = new PackageCard(this.node);
    this.selectAllCheckbox = this.node.getByRole('checkbox', {
      name: 'Select all',
    });
    this.confirmButton = this.node.getByRole('button', {
      name: text.packageLists.confirm,
      exact: true,
    });
    this.replaceButton = this.node.getByRole('button', {
      name: text.packageLists.replace,
      exact: true,
    });
    this.deleteButton = this.node.getByRole('button', {
      name: text.packageLists.delete,
      exact: true,
    });
    this.filterButton = this.node.getByLabel('filter button', { exact: true });
    this.sortButton = this.node.getByLabel('sort button', { exact: true });
    this.createButton = this.node.getByRole('button', {
      name: text.packageLists.create,
      exact: true,
    });
    this.linkButton = this.node.getByRole('button', {
      name: text.packageLists.linkAsAttribution,
      exact: true,
    });
    this.sortings = {
      name: window.getByRole('menuitem', {
        name: text.sortings.name,
      }),
      criticality: window.getByRole('menuitem', {
        name: text.sortings.criticality,
      }),
      occurrence: window.getByRole('menuitem', {
        name: text.sortings.occurrence,
      }),
    };
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
    this.tabs = {
      onResource: this.node.getByRole('tab', {
        name: text.relations.resource,
      }),
      onChildren: this.node.getByRole('tab', {
        name: text.relations.children,
      }),
      onParents: this.node.getByRole('tab', {
        name: text.relations.parents,
      }),
      unrelated: this.node.getByRole('tab', {
        name: text.relations.unrelated,
      }),
    };
    this.searchField = this.header.getByRole('searchbox');
    this.clearSearchButton = this.header.getByLabel('clear search');
  }

  public assert = {
    isVisible: async () => {
      await expect(this.node).toBeVisible();
    },
    isHidden: async () => {
      await expect(this.node).toBeHidden();
    },
    selectedTabIs: async (tab: keyof typeof this.tabs) => {
      await expect(this.tabs[tab]).toHaveAttribute('aria-selected', 'true');
    },
    tabIsVisible: async (tab: keyof typeof this.tabs) => {
      await expect(this.tabs[tab]).toBeVisible();
    },
    tabIsHidden: async (tab: keyof typeof this.tabs) => {
      await expect(this.tabs[tab]).toBeHidden();
    },
    linkButtonIsDisabled: async () => {
      await expect(this.linkButton).toBeDisabled();
    },
    linkButtonIsEnabled: async () => {
      await expect(this.linkButton).toBeEnabled();
    },
    confirmButtonIsDisabled: async () => {
      await expect(this.confirmButton).toBeDisabled();
    },
    confirmButtonIsEnabled: async () => {
      await expect(this.confirmButton).toBeEnabled();
    },
    deleteButtonIsDisabled: async () => {
      await expect(this.deleteButton).toBeDisabled();
    },
    deleteButtonIsEnabled: async () => {
      await expect(this.deleteButton).toBeEnabled();
    },
    replaceButtonIsDisabled: async () => {
      await expect(this.replaceButton).toBeDisabled();
    },
    replaceButtonIsEnabled: async () => {
      await expect(this.replaceButton).toBeEnabled();
    },
    createButtonIsDisabled: async () => {
      await expect(this.createButton).toBeDisabled();
    },
    createButtonIsEnabled: async () => {
      await expect(this.createButton).toBeEnabled();
    },
  };

  async closeMenu() {
    await this.window.keyboard.press('Escape');
  }

  async selectLicenseName(licenseName: string) {
    await this.filters.license.fill(licenseName);
    await this.window.keyboard.press('ArrowUp');
    await this.window.keyboard.press('Enter');
  }
}
