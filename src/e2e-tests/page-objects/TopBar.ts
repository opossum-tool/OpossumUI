// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, Locator, Page } from '@playwright/test';

import { retry } from '../utils/retry';

export class TopBar {
  readonly window: Page;
  readonly node: Locator;
  readonly auditViewButton: Locator;
  readonly reportViewButton: Locator;
  readonly progressBar: Locator;
  readonly openFileButton: Locator;
  readonly tooltip: Locator;

  constructor(window: Page) {
    this.window = window;
    this.node = window.getByLabel('top bar');
    this.auditViewButton = this.node.getByRole('button', { name: 'audit' });
    this.reportViewButton = this.node.getByRole('button', { name: 'report' });
    this.progressBar = this.node.getByLabel('ProgressBar');
    this.openFileButton = this.node.getByRole('button', { name: 'open file' });
    this.tooltip = this.window.getByRole('tooltip');
  }

  public assert = {
    openFileButtonIsVisible: async (): Promise<void> => {
      await expect(this.openFileButton).toBeVisible();
    },
    modeButtonsAreVisible: async (): Promise<void> => {
      await expect(this.auditViewButton).toBeVisible();
      await expect(this.reportViewButton).toBeVisible();
    },
    auditViewIsActive: async (): Promise<void> => {
      await Promise.all([
        expect(this.auditViewButton).toHaveAttribute('aria-pressed', 'true'),
        expect(this.auditViewButton).toBeDisabled(),
        expect(this.reportViewButton).toHaveAttribute('aria-pressed', 'false'),
      ]);
    },
    reportViewIsActive: async (): Promise<void> => {
      await Promise.all([
        expect(this.auditViewButton).toHaveAttribute('aria-pressed', 'false'),
        expect(this.reportViewButton).toHaveAttribute('aria-pressed', 'true'),
        expect(this.reportViewButton).toBeDisabled(),
      ]);
    },
    progressBarTooltipShowsValues: async ({
      filesWithAttributions = 0,
      filesWithOnlyPreSelectedAttributions = 0,
      filesWithOnlySignals = 0,
    }: Partial<{
      filesWithAttributions: number;
      filesWithOnlyPreSelectedAttributions: number;
      filesWithOnlySignals: number;
    }>): Promise<void> => {
      // .hover is flaky on some machines
      await retry(async () => {
        await this.progressBar.hover();
        await Promise.all([
          expect(
            this.tooltip.getByText(
              `with attributions: ${filesWithAttributions}`,
            ),
          ).toBeVisible(),
          expect(
            this.tooltip.getByText(
              `with only pre-selected attributions: ${filesWithOnlyPreSelectedAttributions}`,
            ),
          ).toBeVisible(),
          expect(
            this.tooltip.getByText(
              `with only signals: ${filesWithOnlySignals}`,
            ),
          ).toBeVisible(),
        ]);
      });
    },
  };

  async gotoAuditView(): Promise<void> {
    await this.auditViewButton.click();
  }

  async gotoReportView(): Promise<void> {
    await this.reportViewButton.click();
  }
}
