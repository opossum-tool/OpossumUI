// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, Locator, Page, TestInfo } from '@playwright/test';
import path from 'path';

export class MergeDialog {
  private readonly node: Locator;
  readonly title: Locator;
  readonly inputFileSelection: Locator;
  readonly mergeButton: Locator;
  readonly cancelButton: Locator;
  readonly errorIcon: Locator;

  readonly legacyFilePath: string;
  readonly scancodeFilePath: string;
  readonly owaspFilePath: string;

  constructor(
    window: Page,
    legacyFilename: string | undefined,
    info: TestInfo,
  ) {
    this.node = window.getByLabel('merge dialog');
    this.title = this.node.getByRole('heading').getByText('Merge');
    this.inputFileSelection = this.node
      .getByLabel('Select file to merge')
      .locator('..');
    this.mergeButton = this.node.getByRole('button', { name: 'Merge' });
    this.cancelButton = this.node.getByRole('button', { name: 'Cancel' });
    this.errorIcon = this.node.getByTestId('ErrorIcon').locator('path');

    this.legacyFilePath = info.outputPath(`${legacyFilename}.json`);
    this.scancodeFilePath = path.resolve(__dirname, '..', 'scancode.json');
    this.owaspFilePath = path.resolve(
      __dirname,
      '..',
      'owasp-dependency-check-report.json',
    );
  }

  public assert = {
    titleIsVisible: async (): Promise<void> => {
      await expect(this.title).toBeVisible();
    },
    titleIsHidden: async (): Promise<void> => {
      await expect(this.title).toBeHidden({ timeout: 10000 });
    },
    showsError: async (): Promise<void> => {
      await expect(this.errorIcon).toBeVisible();
    },
  };
}
