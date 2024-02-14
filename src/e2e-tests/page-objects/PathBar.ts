// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

export class PathBar {
  private readonly node: Locator;
  readonly openResourceUrlButton: Locator;
  readonly copyPathButton: Locator;
  readonly goBackButton: Locator;
  readonly goForwardButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('path bar');
    this.openResourceUrlButton = this.node
      .getByRole('button')
      .getByLabel('link to open');
    this.copyPathButton = this.node.getByRole('button').getByLabel('copy path');
    this.goBackButton = this.node.getByRole('button').getByLabel('go back');
    this.goForwardButton = this.node
      .getByRole('button')
      .getByLabel('go forward');
  }

  public assert = {
    breadcrumbsAreVisible: async (
      ...breadcrumbs: Array<string>
    ): Promise<void> => {
      await Promise.all(
        breadcrumbs.map((crumb) =>
          expect(this.node.getByText(crumb)).toBeVisible(),
        ),
      );
    },
    breadcrumbsAreHidden: async (
      ...breadcrumbs: Array<string>
    ): Promise<void> => {
      await Promise.all(
        breadcrumbs.map((crumb) =>
          expect(this.node.getByText(crumb)).toBeHidden(),
        ),
      );
    },
    openResourceUrlButtonIsEnabled: async (): Promise<void> => {
      await expect(this.openResourceUrlButton).toBeEnabled();
    },
    openResourceUrlButtonIsDisabled: async (): Promise<void> => {
      await expect(this.openResourceUrlButton).toBeDisabled();
    },
    goBackButtonIsDisabled: async (): Promise<void> => {
      await expect(this.goBackButton).toBeDisabled();
    },
    goBackButtonIsEnabled: async (): Promise<void> => {
      await expect(this.goBackButton).toBeEnabled();
    },
    goForwardButtonIsDisabled: async (): Promise<void> => {
      await expect(this.goForwardButton).toBeDisabled();
    },
    goForwardButtonIsEnabled: async (): Promise<void> => {
      await expect(this.goForwardButton).toBeEnabled();
    },
  };

  async openResourceUrl(): Promise<void> {
    await this.openResourceUrlButton.click();
  }

  async clickOnBreadcrumb(crumb: string): Promise<void> {
    await this.node.getByText(crumb).click();
  }
}
