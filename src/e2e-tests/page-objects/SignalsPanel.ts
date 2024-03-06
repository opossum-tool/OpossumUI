// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';
import { PackageCard } from './PackageCard';

export class SignalsPanel {
  private readonly window: Page;
  private readonly node: Locator;
  private readonly header: Locator;
  readonly packageCard: PackageCard;
  readonly selectAllCheckbox: Locator;
  readonly linkButton: Locator;
  readonly deleteButton: Locator;
  readonly restoreButton: Locator;
  readonly hideDeletedButton: Locator;
  readonly showDeletedButton: Locator;
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
    readonly previouslyPreferred: Locator;
    readonly license: Locator;
  };
  readonly tabs: {
    readonly onResource: Locator;
    readonly onChildren: Locator;
  };
  readonly searchField: Locator;
  readonly clearSearchButton: Locator;

  constructor(window: Page) {
    this.window = window;
    this.node = window.getByTestId('signals-panel');
    this.header = window.getByTestId('signals-panel-header');
    this.packageCard = new PackageCard(this.node);
    this.selectAllCheckbox = this.node.getByRole('checkbox', {
      name: 'Select all',
    });
    this.deleteButton = this.node.getByRole('button', {
      name: text.packageLists.delete,
      exact: true,
    });
    this.filterButton = this.node.getByLabel('filter button', { exact: true });
    this.sortButton = this.node.getByLabel('sort button', { exact: true });
    this.linkButton = this.node.getByRole('button', {
      name: text.packageLists.linkAsAttribution,
      exact: true,
    });
    this.restoreButton = this.node.getByRole('button', {
      name: text.packageLists.restore,
      exact: true,
    });
    this.hideDeletedButton = this.node.getByRole('button', {
      name: text.packageLists.hideDeleted,
      exact: true,
    });
    this.showDeletedButton = this.node.getByRole('button', {
      name: text.packageLists.showDeleted,
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
      previouslyPreferred: window.getByRole('menuitem', {
        name: text.filters.previouslyPreferred,
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
    linkButtonIsDisabled: async () => {
      await expect(this.linkButton).toBeDisabled();
    },
    linkButtonIsEnabled: async () => {
      await expect(this.linkButton).toBeEnabled();
    },
    restoreButtonIsDisabled: async () => {
      await expect(this.restoreButton).toBeDisabled();
    },
    restoreButtonIsEnabled: async () => {
      await expect(this.restoreButton).toBeEnabled();
    },
    restoreButtonIsHidden: async () => {
      await expect(this.restoreButton).toBeHidden();
    },
    restoreButtonIsVisible: async () => {
      await expect(this.restoreButton).toBeVisible();
    },
    deleteButtonIsDisabled: async () => {
      await expect(this.deleteButton).toBeDisabled();
    },
    deleteButtonIsEnabled: async () => {
      await expect(this.deleteButton).toBeEnabled();
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
