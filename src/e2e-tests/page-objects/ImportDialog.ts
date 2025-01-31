// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page, TestInfo } from '@playwright/test';

export class ImportDialog {
  private readonly node: Locator;
  readonly title: Locator;
  readonly inputFileSelection: Locator;
  readonly opossumFileSelection: Locator;
  readonly importButton: Locator;
  readonly cancelButton: Locator;
  readonly errorIcon: Locator;

  readonly inputFilePath: string;

  constructor(window: Page, filename: string | undefined, info: TestInfo) {
    this.node = window.getByLabel('import dialog');
    this.title = this.node.getByRole('heading').getByText('Import');
    this.inputFileSelection = this.node.getByLabel('Select file to import');
    this.opossumFileSelection = this.node.getByLabel(
      'Select opossum file save location',
    );
    this.importButton = this.node.getByRole('button', { name: 'Import' });
    this.cancelButton = this.node.getByRole('button', { name: 'Cancel' });
    this.errorIcon = this.node.getByTestId('ErrorIcon').locator('path');

    this.inputFilePath = info.outputPath(`${filename}.json`);
  }

  public assert = {
    titleIsVisible: async (): Promise<void> => {
      await expect(this.title).toBeVisible();
    },
    titleIsHidden: async (): Promise<void> => {
      await expect(this.title).toBeHidden();
    },
    showsError: async (): Promise<void> => {
      await expect(this.errorIcon).toBeVisible();
    },
  };
}
