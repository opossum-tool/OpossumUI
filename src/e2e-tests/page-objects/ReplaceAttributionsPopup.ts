// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';
import { PackageCard } from './PackageCard';

export class ReplaceAttributionsPopup {
  private readonly node: Locator;
  readonly cancelButton: Locator;
  readonly replaceButton: Locator;
  readonly searchInput: Locator;
  readonly attributionCard: PackageCard;

  constructor(window: Page) {
    this.node = window.getByLabel('replace attributions popup');
    this.cancelButton = this.node.getByRole('button', {
      name: text.buttons.cancel,
    });
    this.replaceButton = this.node.getByRole('button', {
      name: text.replaceAttributionsPopup.replace,
    });
    this.searchInput = this.node.getByRole('searchbox');
    this.attributionCard = new PackageCard(window, this.node);
  }

  public assert = {
    isVisible: async (): Promise<void> => {
      await expect(this.node).toBeVisible();
    },
    isHidden: async (): Promise<void> => {
      await expect(this.node).toBeHidden();
    },
    replaceButtonIsDisabled: async (): Promise<void> => {
      await expect(this.replaceButton).toBeDisabled();
    },
    replaceButtonIsEnabled: async (): Promise<void> => {
      await expect(this.replaceButton).toBeEnabled();
    },
  };

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async replace(): Promise<void> {
    await this.replaceButton.click();
  }
}
