// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';

export class NotSavedPopup {
  private readonly node: Locator;
  readonly cancelButton: Locator;
  readonly discardButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('unsaved changes popup');
    this.cancelButton = this.node.getByRole('button', {
      name: text.buttons.cancel,
      exact: true,
    });
    this.discardButton = this.node.getByRole('button', {
      name: text.unsavedChangesPopup.discard,
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
