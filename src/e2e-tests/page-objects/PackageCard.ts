// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';
import { compact } from 'lodash';

import { PackageInfo } from '../../shared/shared-types';

export class PackageCard {
  private readonly window: Page;
  private readonly context: Locator;
  readonly contextMenu: {
    readonly confirmButton: Locator;
    readonly confirmGloballyButton: Locator;
    readonly deleteButton: Locator;
    readonly deleteGloballyButton: Locator;
    readonly deleteSelectedGloballyButton: Locator;
    readonly hideButton: Locator;
    readonly markForReplacementButton: Locator;
    readonly openAttributionWizardButton: Locator;
    readonly replaceMarkedButton: Locator;
    readonly showResourcesButton: Locator;
    readonly unhideButton: Locator;
    readonly unmarkForReplacementButton: Locator;
  };

  constructor(window: Page, context: Locator) {
    this.window = window;
    this.context = context;
    this.contextMenu = {
      confirmButton: this.window
        .getByRole('menu')
        .getByRole('button', { name: 'Confirm', exact: true }),
      confirmGloballyButton: this.window
        .getByRole('menu')
        .getByRole('button', { name: 'Confirm globally', exact: true }),
      deleteButton: this.window
        .getByRole('menu')
        .getByRole('button', { name: 'Delete', exact: true }),
      deleteGloballyButton: this.window
        .getByRole('menu')
        .getByRole('button', { name: 'Delete globally', exact: true }),
      markForReplacementButton: this.window
        .getByRole('menu')
        .getByRole('button', {
          name: 'Mark current for replacement',
          exact: true,
        }),
      openAttributionWizardButton: this.window
        .getByRole('menu')
        .getByRole('button', { name: 'Open attribution wizard', exact: true }),
      showResourcesButton: this.window
        .getByRole('menu')
        .getByRole('button', { name: 'Show resources', exact: true }),
      unhideButton: this.window
        .getByRole('menu')
        .getByRole('button', { name: 'Unhide', exact: true }),
      unmarkForReplacementButton: this.window
        .getByRole('menu')
        .getByRole('button', {
          name: 'Unmark current for replacement',
          exact: true,
        }),
      deleteSelectedGloballyButton: this.window
        .getByRole('menu')
        .getByRole('button', { name: 'Delete selected globally', exact: true }),
      hideButton: this.window
        .getByRole('menu')
        .getByRole('button', { name: 'Hide', exact: true }),
      replaceMarkedButton: this.window.getByRole('menu').getByRole('button', {
        name: 'Replace marked with current',
        exact: true,
      }),
    };
  }

  private getCardLabel({ packageName, packageVersion }: PackageInfo): string {
    return compact([packageName, packageVersion]).join(', ');
  }

  private node(
    packageInfo: PackageInfo,
    { subContext }: { subContext?: Locator } = {},
  ): Locator {
    return (subContext ?? this.context).getByLabel(
      `package card ${this.getCardLabel(packageInfo)}`,
    );
  }

  public checkbox(packageInfo: PackageInfo): Locator {
    return this.node(packageInfo).getByRole('checkbox');
  }

  public addButton(packageInfo: PackageInfo): Locator {
    return this.node(packageInfo).getByRole('button').getByLabel('add');
  }

  public preferredIcon(packageInfo: PackageInfo): Locator {
    return this.node(packageInfo).getByLabel('Preferred icon', { exact: true });
  }

  public wasPreferredIcon(packageInfo: PackageInfo): Locator {
    return this.node(packageInfo).getByLabel('was preferred icon');
  }

  public assert = {
    isVisible: async (
      packageInfo: PackageInfo,
      {
        count = 1,
        subContext,
      }: Partial<{ count: number; subContext: Locator }> = {},
    ): Promise<void> => {
      await expect(this.node(packageInfo, { subContext })).toHaveCount(count);
    },
    isHidden: async (
      packageInfo: PackageInfo,
      { subContext }: { subContext?: Locator } = {},
    ): Promise<void> => {
      await expect(this.node(packageInfo, { subContext })).toBeHidden();
    },
    addButtonIsVisible: async (packageInfo: PackageInfo): Promise<void> => {
      await expect(this.addButton(packageInfo)).toBeVisible();
    },
    addButtonIsHidden: async (packageInfo: PackageInfo): Promise<void> => {
      await expect(this.addButton(packageInfo)).toBeHidden();
    },
    preferredIconIsVisible: async (packageInfo: PackageInfo): Promise<void> => {
      await expect(this.preferredIcon(packageInfo)).toBeVisible();
    },
    preferredIconIsHidden: async (packageInfo: PackageInfo): Promise<void> => {
      await expect(this.preferredIcon(packageInfo)).toBeHidden();
    },
    wasPreferredIconIsVisible: async (
      packageInfo: PackageInfo,
    ): Promise<void> => {
      await expect(this.wasPreferredIcon(packageInfo)).toBeVisible();
    },
    wasPreferredIconIsHidden: async (
      packageInfo: PackageInfo,
    ): Promise<void> => {
      await expect(this.wasPreferredIcon(packageInfo)).toBeHidden();
    },
    checkboxIsChecked: async (packageInfo: PackageInfo): Promise<void> => {
      await expect(this.checkbox(packageInfo)).toBeChecked();
    },
    checkboxIsUnchecked: async (packageInfo: PackageInfo): Promise<void> => {
      await expect(this.checkbox(packageInfo)).not.toBeChecked();
    },
    contextMenu: {
      buttonsAreVisible: async (
        ...buttons: Array<keyof typeof this.contextMenu>
      ): Promise<void> => {
        await Promise.all(
          buttons.map((button) =>
            expect(this.contextMenu[button]).toBeVisible(),
          ),
        );
      },
      buttonsAreHidden: async (
        ...buttons: Array<keyof typeof this.contextMenu>
      ): Promise<void> => {
        await Promise.all(
          buttons.map((button) =>
            expect(this.contextMenu[button]).toBeHidden(),
          ),
        );
      },
    },
  };

  async openContextMenu(
    packageInfo: PackageInfo,
    { nth }: { nth: number } = { nth: 0 },
  ): Promise<void> {
    await this.node(packageInfo).nth(nth).click({ button: 'right' });
  }

  async closeContextMenu(): Promise<void> {
    await this.window.keyboard.press('Escape');
  }

  async click(packageInfo: PackageInfo): Promise<void> {
    await this.node(packageInfo).click();
  }
}
