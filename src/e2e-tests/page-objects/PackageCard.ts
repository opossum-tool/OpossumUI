// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator } from '@playwright/test';
import { compact } from 'lodash';

import { RawPackageInfo } from '../../shared/shared-types';
import { text } from '../../shared/text';

export class PackageCard {
  private readonly context: Locator;

  constructor(context: Locator) {
    this.context = context;
  }

  private getCardLabel({
    packageName,
    packageVersion,
    firstParty,
  }: RawPackageInfo): string {
    return firstParty
      ? text.packageLists.firstParty
      : compact([packageName, packageVersion]).join(', ');
  }

  private node(packageInfo: RawPackageInfo): Locator {
    return this.context.getByLabel(
      `package card ${this.getCardLabel(packageInfo)}`,
    );
  }

  public checkbox(packageInfo: RawPackageInfo): Locator {
    return this.node(packageInfo).getByRole('checkbox');
  }

  public preferredIcon(packageInfo: RawPackageInfo): Locator {
    return this.node(packageInfo).getByLabel('Preferred icon', { exact: true });
  }

  public wasPreferredIcon(packageInfo: RawPackageInfo): Locator {
    return this.node(packageInfo).getByLabel('Was Preferred icon', {
      exact: true,
    });
  }

  public assert = {
    isVisible: async (packageInfo: RawPackageInfo): Promise<void> => {
      await expect(this.node(packageInfo)).toBeVisible();
    },
    isHidden: async (packageInfo: RawPackageInfo): Promise<void> => {
      await expect(this.node(packageInfo)).toBeHidden();
    },
    preferredIconIsVisible: async (
      packageInfo: RawPackageInfo,
    ): Promise<void> => {
      await expect(this.preferredIcon(packageInfo)).toBeVisible();
    },
    preferredIconIsHidden: async (
      packageInfo: RawPackageInfo,
    ): Promise<void> => {
      await expect(this.preferredIcon(packageInfo)).toBeHidden();
    },
    wasPreferredIconIsVisible: async (
      packageInfo: RawPackageInfo,
    ): Promise<void> => {
      await expect(this.wasPreferredIcon(packageInfo)).toBeVisible();
    },
    wasPreferredIconIsHidden: async (
      packageInfo: RawPackageInfo,
    ): Promise<void> => {
      await expect(this.wasPreferredIcon(packageInfo)).toBeHidden();
    },
    checkboxIsChecked: async (packageInfo: RawPackageInfo): Promise<void> => {
      await expect(this.checkbox(packageInfo)).toBeChecked();
    },
    checkboxIsUnchecked: async (packageInfo: RawPackageInfo): Promise<void> => {
      await expect(this.checkbox(packageInfo)).not.toBeChecked();
    },
  };

  async click(packageInfo: RawPackageInfo): Promise<void> {
    await this.node(packageInfo).click();
  }
}
