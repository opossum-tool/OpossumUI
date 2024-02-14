// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';

export class ReplaceAttributionsPopup {
  private readonly node: Locator;
  readonly cancelButton: Locator;
  readonly replaceButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('replace attributions popup');
    this.cancelButton = this.node.getByRole('button', {
      name: text.buttons.cancel,
    });
    this.replaceButton = this.node.getByRole('button', {
      name: text.replaceAttributionsPopup.replace,
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
