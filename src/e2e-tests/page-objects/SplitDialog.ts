// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';

export class SplitDialog {
  private readonly node: Locator;
  private readonly destinationPathValue: Locator;
  readonly destinationPathSelection: Locator;
  readonly createButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('split dialog');
    this.destinationPathSelection = this.node.getByTestId(
      'split-destination-path',
    );
    this.destinationPathValue = this.node.getByTestId(
      'split-destination-path-input',
    );
    this.createButton = this.node.getByRole('button', {
      name: text.splitDialog.create,
      exact: true,
    });
    this.cancelButton = this.node.getByRole('button', {
      name: text.buttons.cancel,
      exact: true,
    });
    this.closeButton = this.node.getByRole('button', {
      name: text.buttons.close,
      exact: true,
    });
  }

  public assert = {
    destinationPathIs: async (destinationPath: string): Promise<void> => {
      await expect(this.destinationPathValue).toHaveText(destinationPath);
    },
    showsError: async (message: string): Promise<void> => {
      await expect(this.node.getByText(message)).toBeVisible();
    },
    succeeded: async (): Promise<void> => {
      await expect(this.node.getByText(text.splitDialog.success)).toBeVisible();
    },
    titleIsHidden: async (): Promise<void> => {
      await expect(
        this.node.getByRole('heading', {
          name: text.splitDialog.title,
        }),
      ).toBeHidden();
    },
    titleIsVisible: async (): Promise<void> => {
      await expect(
        this.node.getByRole('heading', {
          name: text.splitDialog.title,
        }),
      ).toBeVisible();
    },
  };

  async toggleResourceSelection(resourceName: string): Promise<void> {
    await this.node
      .getByText(resourceName, { exact: true })
      .locator('..')
      .getByRole('checkbox')
      .click();
  }
}
