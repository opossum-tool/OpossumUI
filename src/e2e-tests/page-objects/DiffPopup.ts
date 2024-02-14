// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';
import { AttributionForm } from './AttributionForm';

export class DiffPopup {
  private readonly node: Locator;
  readonly originalAttributionForm: AttributionForm;
  readonly currentAttributionForm: AttributionForm;
  readonly applyButton: Locator;
  readonly revertAllButton: Locator;
  readonly cancelButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('diff popup');
    this.originalAttributionForm = new AttributionForm(
      this.node.getByLabel('original', { exact: true }),
      window,
    );
    this.currentAttributionForm = new AttributionForm(
      this.node.getByLabel('current', { exact: true }),
      window,
    );
    this.applyButton = this.node.getByRole('button', {
      name: text.diffPopup.applyChanges,
      exact: true,
    });
    this.revertAllButton = this.node.getByRole('button', {
      name: text.diffPopup.revertAll,
      exact: true,
    });
    this.cancelButton = this.node.getByRole('button', {
      name: text.buttons.cancel,
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
    applyButtonIsDisabled: async () => {
      await expect(this.applyButton).toBeDisabled();
    },
    revertAllButtonIsDisabled: async () => {
      await expect(this.revertAllButton).toBeDisabled();
    },
  };
}
