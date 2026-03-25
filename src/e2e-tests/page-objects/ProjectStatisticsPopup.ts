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
  readonly detailsTab: Locator;
  readonly totalSignalCount: Locator;
  readonly attributionsOverviewChart: Locator;
  readonly mostFrequentLicensesChart: Locator;
  readonly signalsByCriticalityChart: Locator;
  readonly signalsByClassificationChart: Locator;
  readonly incompleteAttributionsChart: Locator;
  readonly showOnStartupCheckbox: Locator;
  readonly licenseTable: ProjectStatisticsPopupLicenseTable;

  constructor(window: Page) {
    this.node = window.getByLabel('project statistics');
    this.title = this.node.getByRole('heading').getByText('Project Statistics');
    this.closeButton = this.node.getByRole('button', { name: 'Close' });
    this.detailsTab = this.node.getByRole('tab', {
      name: text.projectStatisticsPopup.tabs.details,
    });
    this.totalSignalCount = this.node
      .getByRole('table')
      .filter({
        hasText:
          text.attributionCountPerSourcePerLicenseTable.columns.licenseName,
      })
      .getByRole('row')
      .last()
      .getByRole('cell')
      .last();
    this.attributionsOverviewChart = this.node.getByTestId(
      'attributionBarChart',
    );
    this.mostFrequentLicensesChart = this.node.getByTestId(
      'mostFrequentLicenseCountPieChart',
    );
    this.signalsByCriticalityChart = this.node.getByTestId(
      'criticalSignalsCountPieChart',
    );
    this.signalsByClassificationChart = this.node.getByTestId(
      'signalCountByClassificationPieChart',
    );
    this.incompleteAttributionsChart = this.node.getByTestId(
      'incompleteAttributionsPieChart',
    );
    this.showOnStartupCheckbox = this.node.getByText(
      text.projectStatisticsPopup.toggleStartupCheckbox,
    );
    this.licenseTable = new ProjectStatisticsPopupLicenseTable(window);
  }

  public assert = {
    titleIsVisible: async (): Promise<void> => {
      await expect(this.title).toBeVisible();
    },
    titleIsHidden: async (): Promise<void> => {
      await expect(this.title).toBeHidden();
    },
    totalSignalCount: async (count: number): Promise<void> => {
      await expect(this.totalSignalCount).toContainText(count.toString());
    },
    attributionPropertiesIsVisible: async (): Promise<void> => {
      await expect(this.attributionsOverviewChart).toContainText(
        text.projectStatisticsPopup.charts.count,
      );
    },
    mostFrequentLicensesPieChartIsVisible: async (
      licenseName: string,
    ): Promise<void> => {
      await expect(this.mostFrequentLicensesChart).toContainText(licenseName);
    },
    signalsByCriticalityIsVisible: async (): Promise<void> => {
      await expect(this.signalsByCriticalityChart).toContainText(
        text.projectStatisticsPopup.charts.criticalSignalsCountPieChart
          .mediumCritical,
      );
    },
    signalsByCriticalityIsNotVisible: async (): Promise<void> => {
      await expect(this.signalsByCriticalityChart).toBeHidden();
    },

    signalsByClassificationIsVisible: async (): Promise<void> => {
      await expect(this.signalsByClassificationChart).toBeVisible();
    },
    signalsByClassificationIsShown: async (): Promise<void> => {
      await expect(this.signalsByClassificationChart).toBeVisible();
    },
    signalsByClassificationIsNotShown: async (): Promise<void> => {
      await expect(this.signalsByClassificationChart).toBeHidden();
    },
    incompleteAttributionsIsVisible: async (): Promise<void> => {
      await expect(this.incompleteAttributionsChart).toContainText(
        text.projectStatisticsPopup.charts.incompleteAttributionsPieChart
          .completeAttributions,
      );
    },
  };
  async openLicensesTab(): Promise<void> {
    await this.assert.titleIsVisible();
    await this.detailsTab.click();
    await this.licenseTable.assert.isVisible();
  }
}

class ProjectStatisticsPopupLicenseTable {
  private readonly node: Locator;
  readonly table: Locator;

  constructor(window: Page) {
    this.node = window.getByTestId('license-table');
    this.table = this.node.getByRole('table');
  }

  public assert = {
    isVisible: async (): Promise<void> => {
      await expect(this.node).toBeVisible();
    },
    columnHasSorting: async (
      columnLabel: string,
      sorting: 'descending' | 'ascending',
    ): Promise<void> => {
      const column = this.node
        .getByTestId('table-cell-with-sorting')
        .filter({ hasText: columnLabel });
      await expect(column).toHaveAttribute('aria-sort', sorting);
    },
  };

  public async clickTableCell(cellContent: string): Promise<void> {
    await this.node.getByText(cellContent).click();
  }
  public async clickColumnHader(headerLabel: string): Promise<void> {
    await this.table
      .getByRole('button', {
        name: headerLabel,
      })
      .click();
  }
}
