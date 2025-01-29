// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page, TestInfo } from '@playwright/test';

export class ImportDialog {
  private readonly node: Locator;
  readonly title: Locator;
  readonly inputFilePathTextField;
  readonly opossumFilePathTextField;
  readonly inputFilePathErrorMessage;
  readonly opossumFilePathErrorMessage;
  readonly importButton: Locator;
  readonly cancelButton: Locator;

  readonly inputFilePath: string;

  constructor(window: Page, filename: string | undefined, info: TestInfo) {
    this.node = window.getByLabel('import dialog');
    this.title = this.node.getByRole('heading').getByText('Import');
    this.inputFilePathTextField = this.node.getByRole('textbox', {
      name: 'File to import',
    });
    this.opossumFilePathTextField = this.node.getByRole('textbox', {
      name: 'Opossum file save location',
    });
    this.inputFilePathErrorMessage = this.node
      .getByLabel('file path helper text')
      .first();
    this.opossumFilePathErrorMessage = this.node
      .getByLabel('file path helper text')
      .last();
    this.importButton = this.node.getByRole('button', { name: 'Import' });
    this.cancelButton = this.node.getByRole('button', { name: 'Cancel' });

    this.inputFilePath = info.outputPath(`${filename}.json`);
  }

  public assert = {
    titleIsVisible: async (): Promise<void> => {
      await expect(this.title).toBeVisible();
    },
    titleIsHidden: async (): Promise<void> => {
      await expect(this.title).toBeHidden();
    },
  };
}
