// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';
import { compact } from 'lodash';

import { PackageInfo } from '../../shared/shared-types';

export class ReportView {
  private readonly node: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('report view');
  }

  public attributionRow(packageInfo: PackageInfo): Locator {
    return this.node.getByLabel(
      `attribution row ${compact([
        packageInfo.packageName,
        packageInfo.packageVersion,
      ]).join(', ')}`,
    );
  }

  public assert = {
    attributionIsVisible: async (packageInfo: PackageInfo): Promise<void> => {
      await expect(this.attributionRow(packageInfo)).toBeVisible();
    },
    attributionIsHidden: async (packageInfo: PackageInfo): Promise<void> => {
      await expect(this.attributionRow(packageInfo)).toBeHidden();
    },
    attributeIsVisible: async (
      packageInfo: PackageInfo,
      attribute: keyof PackageInfo,
    ): Promise<void> => {
      const value = packageInfo[attribute];
      if (value) {
        await expect(
          this.attributionRow(packageInfo).getByText(value.toString()),
        ).toBeVisible();
      }
    },
    matchesPackageInfo: async (info: PackageInfo): Promise<void> => {
      await Promise.all([
        this.assert.attributeIsVisible(info, 'packageName'),
        this.assert.attributeIsVisible(info, 'packageVersion'),
        this.assert.attributeIsVisible(info, 'url'),
        this.assert.attributeIsVisible(info, 'copyright'),
        this.assert.attributeIsVisible(info, 'licenseName'),
        this.assert.attributeIsVisible(info, 'licenseText'),
        this.assert.attributeIsVisible(info, 'comment'),
        this.assert.attributeIsVisible(info, 'attributionConfidence'),
      ]);
    },
  };

  async editAttribution(packageInfo: PackageInfo): Promise<void> {
    await this.attributionRow(packageInfo)
      .getByRole('button')
      .getByLabel('edit')
      .click();
  }
}
