// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';

export class ProjectStatisticsPopup {
  private readonly node: Locator;
  readonly title: Locator;
  readonly closeButton: Locator;
  readonly totalCriticalLicensesCount: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('project statistics');
    this.title = this.node.getByRole('heading').getByText('Project Statistics');
    this.closeButton = this.node.getByRole('button', { name: 'Close' });
    const signalsCount = window.getByText(
      text.projectStatisticsPopup.criticalLicensesSignalCountColumnName,
    );
    this.totalCriticalLicensesCount = this.node
      .getByRole('table')
      .filter({ has: signalsCount })
      .getByRole('row')
      .last()
      .getByRole('cell')
      .last();
  }

  public assert = {
    titleIsVisible: async (): Promise<void> => {
      await expect(this.title).toBeVisible();
    },
    titleIsHidden: async (): Promise<void> => {
      await expect(this.title).toBeHidden();
    },
    criticalLicenseCount: async (count: number): Promise<void> => {
      await expect(this.totalCriticalLicensesCount).toContainText(
        count.toString(),
      );
    },
  };
}
