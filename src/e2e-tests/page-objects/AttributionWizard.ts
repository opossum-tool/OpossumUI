// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

export class AttributionWizard {
  private readonly node: Locator;
  readonly cancelButton: Locator;
  readonly nextButton: Locator;
  readonly backButton: Locator;
  readonly applyButton: Locator;
  readonly packageNamespaceList: Locator;
  readonly packageNameList: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('attribution wizard');
    this.cancelButton = this.node.getByRole('button', { name: 'Cancel' });
    this.nextButton = this.node.getByRole('button', { name: 'Next' });
    this.backButton = this.node.getByRole('button', { name: 'Back' });
    this.applyButton = this.node.getByRole('button', { name: 'Apply' });
    this.packageNamespaceList = this.node.getByLabel('package namespace list');
    this.packageNameList = this.node.getByLabel('package name list');
  }

  public assert = {
    isVisible: async (): Promise<void> => {
      await expect(this.node).toBeVisible();
    },
    isHidden: async (): Promise<void> => {
      await expect(this.node).toBeHidden();
    },
  };

  public addItemToPackageNamespaceList = async (
    namespace: string,
  ): Promise<void> => {
    await this.packageNamespaceList.getByLabel('Add new item').fill(namespace);
    await this.packageNamespaceList
      .getByLabel('Click to add a new item to the list')
      .click();
  };
}
