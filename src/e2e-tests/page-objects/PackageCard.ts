// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator } from '@playwright/test';
import { compact } from 'lodash';

import { PackageInfo } from '../../shared/shared-types';

export class PackageCard {
  private readonly context: Locator;

  constructor(context: Locator) {
    this.context = context;
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

  public showResourcesButton(packageInfo: PackageInfo): Locator {
    return this.node(packageInfo).getByLabel('show resources');
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
  };

  async click(packageInfo: PackageInfo): Promise<void> {
    await this.node(packageInfo).click();
  }
}
