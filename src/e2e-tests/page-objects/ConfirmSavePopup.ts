// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';

export class ConfirmSavePopup {
  private readonly node: Locator;
  readonly cancelButton: Locator;
  readonly saveButton: Locator;
  readonly saveGloballyButton: Locator;
  readonly saveLocallyButton: Locator;
  readonly confirmButton: Locator;
  readonly confirmGloballyButton: Locator;
  readonly confirmLocallyButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('confirm save popup');
    this.cancelButton = this.node.getByRole('button', {
      name: text.buttons.cancel,
      exact: true,
    });
    this.saveButton = this.node.getByRole('button', {
      name: text.saveAttributionsPopup.save,
      exact: true,
    });
    this.saveGloballyButton = this.node.getByRole('button', {
      name: text.saveAttributionsPopup.saveGlobally,
      exact: true,
    });
    this.saveLocallyButton = this.node.getByRole('button', {
      name: text.saveAttributionsPopup.saveLocally,
      exact: true,
    });
    this.confirmButton = this.node.getByRole('button', {
      name: text.saveAttributionsPopup.confirm,
      exact: true,
    });
    this.confirmGloballyButton = this.node.getByRole('button', {
      name: text.saveAttributionsPopup.confirmGlobally,
      exact: true,
    });
    this.confirmLocallyButton = this.node.getByRole('button', {
      name: text.saveAttributionsPopup.confirmLocally,
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
