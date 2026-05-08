// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';
import * as path from 'path';

export class ImportDialog {
  private readonly node: Locator;
  private readonly inputFileSelectionValue: Locator;
  private readonly opossumFileSelectionValue: Locator;
  readonly title: Locator;
  readonly inputFileSelection: Locator;
  readonly opossumFileSelection: Locator;
  readonly importButton: Locator;
  readonly cancelButton: Locator;
  readonly errorIcon: Locator;

  readonly scancodeFilePath: string;
  readonly owaspFilePath: string;

  constructor(window: Page) {
    this.node = window.getByLabel('import dialog');
    this.title = this.node.getByRole('heading').getByText('Import');
    this.inputFileSelection = window.getByTestId(
      'import-input-file-path-input',
    );
    this.opossumFileSelection = window.getByTestId(
      'import-opossum-file-path-input',
    );
    this.inputFileSelectionValue = window.getByTestId('import-input-file-path');
    this.opossumFileSelectionValue = window.getByTestId(
      'import-opossum-file-path',
    );
    this.importButton = this.node.getByRole('button', {
      name: 'Import',
      exact: true,
    });
    this.cancelButton = this.node.getByRole('button', {
      name: 'Cancel',
      exact: true,
    });
    this.errorIcon = this.node.getByTestId('ErrorIcon').locator('path');

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
      await expect(this.title).toBeHidden({ timeout: 30000 });
    },
    inputFilePathIsVisible: async (filePath: string): Promise<void> => {
      await expect(this.inputFileSelectionValue).toContainText(filePath);
    },
    opossumFilePathIsVisible: async (filePath: string): Promise<void> => {
      await expect(this.opossumFileSelectionValue).toContainText(filePath);
    },
    showsError: async (): Promise<void> => {
      await expect(this.errorIcon).toBeVisible();
    },
  };
}
