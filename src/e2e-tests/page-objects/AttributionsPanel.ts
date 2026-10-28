// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import type { RawPackageInfo } from '../../shared/shared-types';
import { text } from '../../shared/text';
import { scrollToBottomUntilVisible } from '../utils/scroll-to-bottom-until-visible';
import { PackageCard } from './PackageCard';

export class AttributionsPanel {
  private readonly window: Page;
  private readonly node: Locator;
  private readonly header: Locator;
  private readonly loadingIndicator: Locator;
  private readonly scroller: Locator;
  readonly packageCard: PackageCard;
  readonly selectAllCheckbox: Locator;
  readonly createButton: Locator;
  readonly linkButton: Locator;
  readonly confirmButton: Locator;
  readonly replaceButton: Locator;
  readonly deleteButton: Locator;
  readonly filterButton: Locator;
  readonly filterMenu: Locator;
  readonly licenseTrigger: Locator;
  readonly licenseEditor: Locator;
  readonly licenseSearch: Locator;
  readonly licenseList: Locator;
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
    readonly incompleteCoordinates: Locator;
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
    this.loadingIndicator = this.node.getByTestId('loading');
    this.scroller = this.node.locator('[data-virtuoso-scroller="true"]');
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
    this.filterMenu = window.getByRole('menu');
    this.licenseTrigger = this.filterMenu.locator('[aria-haspopup="dialog"]');
    this.licenseEditor = window.getByRole('dialog', {
      name: text.licenseEditor.title,
    });
    this.licenseSearch = this.licenseEditor.getByRole('textbox', {
      name: text.licenseEditor.search,
    });
    this.licenseList = this.licenseEditor.getByRole('listbox', {
      name: text.licenseEditor.names,
    });
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
      incompleteCoordinates: window.getByLabel(
        'incomplete component coordinates',
      ),
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

  licenseOption(name: string): Locator {
    return this.licenseList.getByRole('option', { name, exact: true });
  }

  public assert = {
    isVisible: async () => {
      await expect(this.node).toBeVisible();
    },
    isHidden: async () => {
      await expect(this.node).toBeHidden();
    },
    loadingIndicatorIsHidden: async () => {
      await expect(this.loadingIndicator).toBeHidden();
    },
    selectedTabIs: async (tab: keyof typeof this.tabs) => {
      await expect(this.tabs[tab]).toHaveAttribute('aria-selected', 'true');
    },
    selectedAttributionIs: async (attributionId: string) => {
      await expect(this.node.locator('[data-selected-id]')).toHaveAttribute(
        'data-selected-id',
        attributionId,
      );
    },
    onResourceCountIs: async (count: number, timeout?: number) => {
      await expect(this.tabs.onResource).toHaveAccessibleName(
        `${text.relations.resource} (${new Intl.NumberFormat().format(count)})`,
        { timeout },
      );
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
    licenseOptionIsActiveAndInView: async (name: string) => {
      const option = this.licenseOption(name);
      await expect(option).toBeVisible();
      await expect(this.licenseList).toHaveAttribute(
        'aria-activedescendant',
        (await option.getAttribute('id'))!,
      );
      await expect
        .poll(() =>
          option.evaluate((element) => {
            const bounds = element.getBoundingClientRect();
            const listBounds = element
              .closest('[role="listbox"]')!
              .getBoundingClientRect();
            return (
              bounds.top >= listBounds.top - 1 &&
              bounds.bottom <= listBounds.bottom + 1
            );
          }),
        )
        .toBe(true);
    },
  };

  async openLicenseEditor() {
    await this.filterButton.click();
    await expect(this.filterMenu).toBeVisible();
    // Let the menu finish growing before the virtualized picker measures its rows.
    await this.filterMenu.locator('..').evaluate(async (paper) => {
      await Promise.allSettled(
        paper.getAnimations().map((animation) => animation.finished),
      );
    });
    await this.licenseTrigger.click();
    await expect(this.licenseSearch).toBeFocused();
  }

  async filterByLicense(licenseName: string) {
    await this.openLicenseEditor();
    await this.licenseSearch.fill(licenseName);
    const option = this.licenseOption(licenseName);
    await option.click();
    await expect(option).toHaveAttribute('aria-selected', 'true');
    await this.licenseSearch.press('Escape');
    await this.filterMenu.press('Escape');
    await expect(this.filterMenu).toBeHidden();
  }

  async closeFilterMenu() {
    if (await this.filterMenu.isVisible()) {
      await this.filterMenu.press('Escape');
    }
  }

  async selectIncompleteCoordinates(value: string) {
    await this.filters.incompleteCoordinates.click();
    await this.window.getByRole('option', { name: value, exact: true }).click();
  }

  async clearFilters() {
    await this.window
      .getByRole('menuitem', { name: text.packageLists.clearFilters })
      .click();
  }

  async scrollToTop(): Promise<void> {
    await this.scroller.evaluate((scroller) => {
      scroller.scrollTo({ top: 0 });
    });
  }

  async scrollToBottomUntilVisible(packageInfo: RawPackageInfo): Promise<void> {
    await scrollToBottomUntilVisible(
      this.scroller,
      this.packageCard.node(packageInfo),
    );
  }
}
