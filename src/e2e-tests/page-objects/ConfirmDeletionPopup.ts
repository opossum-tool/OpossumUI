// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';

export class ConfirmDeletionPopup {
  private readonly node: Locator;
  readonly cancelButton: Locator;
  readonly deleteButton: Locator;
  readonly deleteGloballyButton: Locator;
  readonly deleteLocallyButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('confirm deletion popup');
    this.cancelButton = this.node.getByRole('button', {
      name: text.buttons.cancel,
      exact: true,
    });
    this.deleteButton = this.node.getByRole('button', {
      name: text.deleteAttributionsPopup.delete,
      exact: true,
    });
    this.deleteGloballyButton = this.node.getByRole('button', {
      name: text.deleteAttributionsPopup.deleteGlobally,
      exact: true,
    });
    this.deleteLocallyButton = this.node.getByRole('button', {
      name: text.deleteAttributionsPopup.deleteLocally,
      exact: true,
    });
  }

  public assert = {
    isVisible: async (): Promise<void> => {
      await expect(this.node).toBeVisible();
    },
    isHidden: async (): Promise<void> => {
      await expect(this.node).toBeHidden();
    },
    hasText: async (text: string): Promise<void> => {
      await expect(this.node.getByText(text)).toBeVisible();
    },
  };
}
