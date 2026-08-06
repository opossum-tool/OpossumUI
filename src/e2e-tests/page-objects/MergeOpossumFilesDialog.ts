// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';

export class MergeOpossumFilesDialog {
  private readonly node: Locator;
  private readonly processingPopup: Locator;
  readonly inputFileSelection: Locator;
  readonly outputFileSelection: Locator;
  readonly mergeButton: Locator;
  readonly mergeAnywayButton: Locator;
  readonly warning: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('merge split Opossum files dialog');
    this.processingPopup = window.getByRole('dialog', {
      name: text.processPopup.title,
    });
    this.inputFileSelection = window.getByTestId(
      'merge-opossum-files-input-paths',
    );
    this.outputFileSelection = window.getByTestId(
      'merge-opossum-files-output-path',
    );
    this.mergeButton = this.node.getByRole('button', {
      name: 'Merge',
      exact: true,
    });
    this.mergeAnywayButton = this.node.getByRole('button', {
      name: 'Merge anyway',
      exact: true,
    });
    this.warning = this.node.getByRole('alert');
  }

  public async selectNewOutputFile(): Promise<void> {
    await this.node
      .getByLabel(text.mergeOpossumFilesDialog.mergeIntoCurrentProject)
      .setChecked(false);
  }

  public async merge(): Promise<void> {
    await this.mergeButton.click();
    await this.waitForMergeToComplete();
  }

  public async mergeAnyway(): Promise<void> {
    await this.mergeAnywayButton.click();
    await this.waitForMergeToComplete();
  }

  private async waitForMergeToComplete(): Promise<void> {
    await this.assert.isHidden();
    await expect(this.processingPopup).toBeHidden({ timeout: 30000 });
    await this.assert.isHidden();
  }

  public assert = {
    isVisible: async (): Promise<void> => {
      await expect(this.node).toBeVisible();
    },
    isHidden: async (): Promise<void> => {
      await expect(this.node).toBeHidden({ timeout: 30000 });
    },
    inputFileIsVisible: async (filePath: string): Promise<void> => {
      await expect(this.node.getByText(filePath)).toBeVisible();
    },
    mergesIntoCurrentProject: async (): Promise<void> => {
      await expect(
        this.node.getByLabel(
          text.mergeOpossumFilesDialog.mergeIntoCurrentProject,
        ),
      ).toBeChecked();
    },
  };
}
