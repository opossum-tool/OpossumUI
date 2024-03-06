// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

export class FileSupportPopup {
  private readonly node: Locator;
  readonly title: Locator;
  readonly keepButton: Locator;
  readonly convertButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('file support');
    this.title = this.node.getByText('outdated input file format');
    this.keepButton = this.node.getByRole('button', { name: 'keep' });
    this.convertButton = this.node.getByRole('button', {
      name: 'create and proceed',
    });
  }

  public assert = {
    titleIsVisible: async (): Promise<void> => {
      await expect(this.title).toBeVisible();
    },
    titleIsHidden: async (): Promise<void> => {
      await expect(this.title).toBeHidden();
    },
  };
}
