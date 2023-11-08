// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page, retry } from '../utils';

export class TopBar {
  readonly window: Page;
  readonly node: Locator;
  readonly auditViewButton: Locator;
  readonly attributionViewButton: Locator;
  readonly reportViewButton: Locator;
  readonly progressBar: Locator;

  constructor(window: Page) {
    this.window = window;
    this.node = window.getByLabel('top bar');
    this.auditViewButton = this.node.getByRole('button', { name: 'audit' });
    this.attributionViewButton = this.node.getByRole('button', {
      name: 'attribution',
    });
    this.reportViewButton = this.node.getByRole('button', { name: 'report' });
    this.progressBar = this.node.getByLabel('TopProgressBar');
  }

  public assert = {
    modeButtonsAreVisible: async (): Promise<void> => {
      await expect(this.auditViewButton).toBeVisible();
      await expect(this.attributionViewButton).toBeVisible();
      await expect(this.reportViewButton).toBeVisible();
    },
    auditViewIsActive: async (): Promise<void> => {
      await Promise.all([
        expect(this.auditViewButton).toHaveAttribute('aria-pressed', 'true'),
        expect(this.auditViewButton).toBeDisabled(),
        expect(this.attributionViewButton).toHaveAttribute(
          'aria-pressed',
          'false',
        ),
        expect(this.reportViewButton).toHaveAttribute('aria-pressed', 'false'),
      ]);
    },
    attributionViewIsActive: async (): Promise<void> => {
      await Promise.all([
        expect(this.auditViewButton).toHaveAttribute('aria-pressed', 'false'),
        expect(this.attributionViewButton).toHaveAttribute(
          'aria-pressed',
          'true',
        ),
        expect(this.attributionViewButton).toBeDisabled(),
        expect(this.reportViewButton).toHaveAttribute('aria-pressed', 'false'),
      ]);
    },
    reportViewIsActive: async (): Promise<void> => {
      await Promise.all([
        expect(this.auditViewButton).toHaveAttribute('aria-pressed', 'false'),
        expect(this.attributionViewButton).toHaveAttribute(
          'aria-pressed',
          'false',
        ),
        expect(this.reportViewButton).toHaveAttribute('aria-pressed', 'true'),
        expect(this.reportViewButton).toBeDisabled(),
      ]);
    },
    progressBarTooltipShowsValues: async ({
      numberOfFiles = 0,
      filesWithAttributions = 0,
      filesWithOnlyPreSelectedAttributions = 0,
      filesWithOnlySignals = 0,
    }: Partial<{
      numberOfFiles: number;
      filesWithAttributions: number;
      filesWithOnlyPreSelectedAttributions: number;
      filesWithOnlySignals: number;
    }>): Promise<void> => {
      // .hover is flaky on some machines
      await retry({
        fn: async () => {
          await this.progressBar.hover();
          await Promise.all([
            expect(
              this.window
                .getByRole('tooltip')
                .getByText(`Number of files: ${numberOfFiles}`),
            ).toBeVisible(),
            expect(
              this.window
                .getByRole('tooltip')
                .getByText(`Files with attributions: ${filesWithAttributions}`),
            ).toBeVisible(),
            expect(
              this.window
                .getByRole('tooltip')
                .getByText(
                  `Files with only pre-selected attributions: ${filesWithOnlyPreSelectedAttributions}`,
                ),
            ).toBeVisible(),
            expect(
              this.window
                .getByRole('tooltip')
                .getByText(`Files with only signals: ${filesWithOnlySignals}`),
            ).toBeVisible(),
          ]);
        },
      });
    },
  };

  async gotoAuditView(): Promise<void> {
    await this.auditViewButton.click();
  }

  async gotoAttributionView(): Promise<void> {
    await this.attributionViewButton.click();
  }

  async gotoReportView(): Promise<void> {
    await this.reportViewButton.click();
  }
}
