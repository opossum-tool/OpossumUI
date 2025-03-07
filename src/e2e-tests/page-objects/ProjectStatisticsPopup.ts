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
  readonly attributionsOverviewDiv: Locator;
  readonly mostFrequentLicensesDiv: Locator;
  readonly signalsByCriticalityDiv: Locator;
  readonly signalsByClassificationDiv: Locator;
  readonly incompleteAttributionsDiv: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('project statistics');
    this.title = this.node.getByRole('heading').getByText('Project Statistics');
    this.closeButton = this.node.getByRole('button', { name: 'Close' });
    this.detailsTab = this.node.getByRole('tab', { name: 'Details' });
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
    this.attributionsOverviewDiv = this.node.locator('div').filter({
      hasText: text.projectStatisticsPopup.charts.attributionProperties.title,
      hasNotText:
        text.projectStatisticsPopup.charts.mostFrequentLicenseCountPieChart,
    });
    this.mostFrequentLicensesDiv = this.node.locator('div').filter({
      hasText:
        text.projectStatisticsPopup.charts.mostFrequentLicenseCountPieChart,
      hasNotText:
        text.projectStatisticsPopup.charts.attributionProperties.title,
    });
    this.signalsByCriticalityDiv = this.node.locator('div').filter({
      hasText:
        text.projectStatisticsPopup.charts.criticalSignalsCountPieChart.title,
      hasNotText:
        text.projectStatisticsPopup.charts.attributionProperties.title,
    });
    this.signalsByClassificationDiv = this.node.locator('div').filter({
      hasText:
        text.projectStatisticsPopup.charts.signalCountByClassificationPieChart
          .title,
      hasNotText:
        text.projectStatisticsPopup.charts.attributionProperties.title,
    });
    this.incompleteAttributionsDiv = this.node.locator('div').filter({
      hasText:
        text.projectStatisticsPopup.charts.incompleteAttributionsPieChart.title,
      hasNotText:
        text.projectStatisticsPopup.charts.attributionProperties.title,
    });
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
      await expect(
        this.attributionsOverviewDiv.getByText(
          text.projectStatisticsPopup.charts.count,
        ),
      ).toBeVisible();
    },
    mostFrequentLicensesPieChartIsVisible: async (
      licenseName: string,
    ): Promise<void> => {
      await expect(
        this.mostFrequentLicensesDiv.getByText(licenseName),
      ).toBeVisible();
    },
    signalsByCriticalityIsVisible: async (): Promise<void> => {
      await expect(
        this.signalsByCriticalityDiv.getByText(
          text.projectStatisticsPopup.charts.criticalSignalsCountPieChart
            .mediumCritical,
        ),
      ).toBeVisible();
    },
    signalsByClassificationIsVisible: async (): Promise<void> => {
      await expect(
        this.signalsByClassificationDiv.getByText(
          text.projectStatisticsPopup.charts.signalCountByClassificationPieChart
            .noClassification,
        ),
      ).toBeVisible();
    },
    incompleteAttributionsIsVisible: async (): Promise<void> => {
      await expect(
        this.incompleteAttributionsDiv.getByText(
          text.projectStatisticsPopup.charts.incompleteAttributionsPieChart
            .incompleteAttributions,
        ),
      ).toBeVisible();
    },
  };
}
