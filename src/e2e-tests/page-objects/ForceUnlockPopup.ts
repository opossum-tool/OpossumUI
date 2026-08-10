// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';

export class ForceUnlockPopup {
  private readonly node: Locator;
  readonly cancelButton: Locator;
  readonly forceUnlockButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('force unlock popup');
    this.cancelButton = this.node.getByRole('button', {
      name: text.buttons.cancel,
      exact: true,
    });
    this.forceUnlockButton = this.node.getByRole('button', {
      name: text.forceUnlock.confirm,
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
  };
}
