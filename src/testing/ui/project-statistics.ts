// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { text } from '../../shared/text';
import { type SendToChannel, SETTLED_TIMEOUT } from './common';
import { clickPopupButton, expectPopupHidden } from './popups';

export const PROJECT_STATISTICS_POPUP_LABEL = 'project statistics';

export async function openProjectStatisticsPopup(
  sendToChannel: SendToChannel,
): Promise<void> {
  sendToChannel(AllowedFrontendChannels.ShowProjectStatisticsPopup, true);
  await waitFor(() => {
    expect(screen.getByLabelText(PROJECT_STATISTICS_POPUP_LABEL)).toBeVisible();
  }, SETTLED_TIMEOUT);
  await waitFor(() => {
    expect(screen.getByTestId('attributionBarChart')).toBeVisible();
  }, SETTLED_TIMEOUT);
}

export type StatisticsChartTestId =
  | 'attributionBarChart'
  | 'mostFrequentLicenseCountPieChart'
  | 'criticalSignalsCountPieChart'
  | 'signalCountByClassificationPieChart'
  | 'incompleteAttributionsPieChart';

// Each chart renders its title inside the container with the chart test id,
// so asserting the title alongside the container keeps mislabelled or
// removed titles from passing unnoticed. Chart titles can also appear as
// legend labels inside their own chart (e.g. 'Incomplete Attributions'), so
// match all occurrences and require at least the title to be visible.
const STATISTICS_CHART_TITLES: Record<StatisticsChartTestId, string> = {
  attributionBarChart:
    text.projectStatisticsPopup.charts.attributionProperties.title,
  mostFrequentLicenseCountPieChart:
    text.projectStatisticsPopup.charts.mostFrequentLicenseCountPieChart,
  criticalSignalsCountPieChart:
    text.projectStatisticsPopup.charts.criticalSignalsCountPieChart.title,
  signalCountByClassificationPieChart:
    text.projectStatisticsPopup.charts.signalCountByClassificationPieChart
      .title,
  incompleteAttributionsPieChart:
    text.projectStatisticsPopup.charts.incompleteAttributionsPieChart.title,
};

export async function expectStatisticsCharts(
  visible: Array<StatisticsChartTestId>,
  hidden: Array<StatisticsChartTestId> = [],
): Promise<void> {
  for (const testId of visible) {
    await waitFor(() => {
      const chart = screen.getByTestId(testId);
      expect(chart).toBeVisible();
      const titleMatches = within(chart).getAllByText(
        STATISTICS_CHART_TITLES[testId],
      );
      for (const titleMatch of titleMatches) {
        expect(titleMatch).toBeVisible();
      }
    }, SETTLED_TIMEOUT);
  }
  for (const testId of hidden) {
    await waitFor(() => {
      expect(screen.queryByTestId(testId)).toBeNull();
      expect(screen.queryByText(STATISTICS_CHART_TITLES[testId])).toBeNull();
    }, SETTLED_TIMEOUT);
  }
}

function getProjectStatisticsPopup(): HTMLElement {
  return screen.getByLabelText(PROJECT_STATISTICS_POPUP_LABEL);
}

export async function expectProjectStatisticsTitleIsVisible(): Promise<void> {
  await waitFor(() => {
    expect(
      within(getProjectStatisticsPopup()).getByRole('heading', {
        name: text.projectStatisticsPopup.title,
      }),
    ).toBeVisible();
  }, SETTLED_TIMEOUT);
}

export async function closeProjectStatisticsPopup(): Promise<void> {
  await clickPopupButton(PROJECT_STATISTICS_POPUP_LABEL, text.buttons.close);
  await expectPopupHidden(PROJECT_STATISTICS_POPUP_LABEL);
}

export async function clickProjectStatisticsTab(
  tab: 'overview' | 'details',
): Promise<void> {
  await userEvent.click(
    within(getProjectStatisticsPopup()).getByRole('tab', {
      name: text.projectStatisticsPopup.tabs[tab],
    }),
  );
}

const LICENSE_TABLE_TEST_ID = 'license-table';

function getLicenseTable(): HTMLElement {
  return screen.getByTestId(LICENSE_TABLE_TEST_ID);
}

export async function expectProjectStatisticsLicenseTableIsVisible(): Promise<void> {
  await waitFor(() => {
    expect(getLicenseTable()).toBeVisible();
  }, SETTLED_TIMEOUT);
}

export async function expectStatisticsChartContainsText(
  chartTestId: StatisticsChartTestId,
  expectedText: string,
): Promise<void> {
  await waitFor(() => {
    expect(
      within(getStatisticsChart(chartTestId)).getByText(expectedText),
    ).toBeVisible();
  }, SETTLED_TIMEOUT);
}

export function getStatisticsChart(
  chartTestId: StatisticsChartTestId,
): HTMLElement {
  return screen.getByTestId(chartTestId);
}

export async function clickStatisticsChartLegend(
  chartTestId: StatisticsChartTestId,
  label: string,
): Promise<void> {
  await userEvent.click(
    within(getStatisticsChart(chartTestId)).getByRole('button', {
      name: label,
    }),
  );
}

export async function expectStatisticsChartEntryIsPlainText(
  chartTestId: StatisticsChartTestId,
  label: string,
): Promise<void> {
  await waitFor(() => {
    const chart = getStatisticsChart(chartTestId);
    expect(within(chart).getByText(label)).toBeVisible();
    expect(within(chart).queryByRole('button', { name: label })).toBeNull();
  }, SETTLED_TIMEOUT);
}

export async function expectLicenseTableTotalSignalCountIs(
  count: number,
): Promise<void> {
  await waitFor(() => {
    const rows = within(getLicenseTable()).getAllByRole('row');
    const footerCells = within(rows.at(-1) as HTMLElement).getAllByRole('cell');
    expect(footerCells.at(-1)?.textContent).toBe(String(count));
  }, SETTLED_TIMEOUT);
}

export async function clickLicenseTableCell(name: string): Promise<void> {
  await userEvent.click(within(getLicenseTable()).getByText(name));
}

function getLicenseTableSortingCell(columnLabel: string): HTMLElement {
  const cell = within(getLicenseTable())
    .getAllByTestId('table-cell-with-sorting')
    .find((candidate) => candidate.textContent?.includes(columnLabel));
  expect(cell).not.toBeUndefined();
  return cell as HTMLElement;
}

export async function clickLicenseTableColumnHeader(
  columnLabel: string,
): Promise<void> {
  const escapedLabel = columnLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await userEvent.click(
    within(getLicenseTable()).getByRole('button', {
      name: new RegExp(`^${escapedLabel}`),
    }),
  );
}

export async function expectLicenseTableColumnHasSorting(
  columnLabel: string,
  sorting: 'ascending' | 'descending',
): Promise<void> {
  await waitFor(() => {
    expect(getLicenseTableSortingCell(columnLabel)).toHaveAttribute(
      'aria-sort',
      sorting,
    );
  }, SETTLED_TIMEOUT);
}

export async function expectStatisticsChartNotContainsText(
  chartTestId: StatisticsChartTestId,
  unexpectedText: string,
): Promise<void> {
  await waitFor(() => {
    expect(
      within(screen.getByTestId(chartTestId)).queryByText(unexpectedText),
    ).toBeNull();
  }, SETTLED_TIMEOUT);
}
