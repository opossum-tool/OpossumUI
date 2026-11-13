// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import type * as Recharts from 'recharts';
import { describe, expect, it, vi } from 'vitest';

import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { Criticality, RawCriticality } from '../shared/shared-types';
import { text } from '../shared/text';
import { renderApp } from '../testing/render-app';
import {
  applyPanelFilter,
  ATTRIBUTIONS_PANEL,
  clickPackageCard,
  clickPanelFilterMenuButton,
  clickPopupButton,
  clickProjectStatisticsTab,
  clickStatisticsChartLegend,
  closeFilterMenu,
  expectFilterMenuDropdownValue,
  expectFormFieldValues,
  expectPackageCards,
  expectPathBarCrumbs,
  expectPopupHidden,
  expectSearchValue,
  expectStatisticsChartEntryIsPlainText,
  expectViewIsActive,
  fillFormField,
  fillPanelSearch,
  getStatisticsChart,
  gotoReportView,
  gotoResource,
  openProjectStatisticsPopup,
  PROJECT_STATISTICS_POPUP_LABEL,
  selectFilterMenuDropdown,
  SIGNALS_PANEL,
  type StatisticsChartTestId,
} from '../testing/ui';

// Happy DOM cannot lay out responsive charts. Fix only their container size;
// render the real chart, labels, legends, and activation handlers.
vi.mock('recharts', async (importOriginal) => {
  const recharts = await importOriginal<typeof Recharts>();
  return {
    ...recharts,
    ResponsiveContainer: (
      props: ComponentProps<typeof recharts.ResponsiveContainer>,
    ) => <recharts.ResponsiveContainer {...props} width={800} height={600} />,
  };
});

const signals = {
  high: {
    packageName: 'high-signal',
    licenseName: 'MIT',
    criticality: 'high',
    classification: 0,
  },
  medium: {
    packageName: 'medium-signal',
    licenseName: 'Apache-2.0',
    criticality: 'medium',
    classification: 1,
  },
  none: {
    packageName: 'uncritical-signal',
    licenseName: 'Other',
    classification: 1,
  },
};
const attributions = {
  review: {
    packageName: 'review-attribution',
    licenseName: 'MIT',
    needsReview: true,
  },
  follow: {
    packageName: 'follow-up-attribution',
    licenseName: 'MIT',
    followUp: 'FOLLOW_UP' as const,
  },
  first: { packageName: 'first-party-attribution', firstParty: true },
  complete: { packageName: 'complete-attribution', licenseName: 'MIT' },
};
const navigationData = getParsedInputFileEnrichedWithTestData({
  config: { classifications: { 0: 'Default', 1: 'Restricted' } },
  resources: { 'package.ts': 1 },
  externalAttributions: deserializeAttributions(signals),
  resourcesToExternalAttributions: { '/package.ts': Object.keys(signals) },
  manualAttributions: deserializeAttributions(attributions),
  resourcesToManualAttributions: { '/package.ts': Object.keys(attributions) },
});

async function openStatistics(): Promise<void> {
  const { sendToChannel } = await renderApp({
    data: navigationData,
    userSettings: { showCriticality: true, showClassifications: true },
  });
  await openProjectStatisticsPopup(sendToChannel);
}

describe('statistics navigation', () => {
  it.each<[StatisticsChartTestId, string]>([
    ['mostFrequentLicenseCountPieChart', 'MIT'],
    ['attributionBarChart', 'Needs Review'],
  ])(
    'shows only one tooltip for %s on hover and keyboard focus',
    async (chartId, label) => {
      await openStatistics();
      const chart = within(getStatisticsChart(chartId));
      act(() => chart.getByRole('application').focus());
      await userEvent.keyboard('{ArrowRight}');
      expect(await chart.findByRole('status')).toBeVisible();
      const button = chart.getByRole('button', {
        name: label,
      });
      await userEvent.hover(button);
      expect(await screen.findByRole('tooltip')).toBeVisible();
      expect(button).toHaveAccessibleName(label);
      expect(chart.queryByRole('status')).not.toBeInTheDocument();
      await userEvent.unhover(button);
      await waitFor(() =>
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
      );
      await userEvent.tab();
      act(() => button.focus());
      expect(await screen.findByRole('tooltip')).toBeVisible();
      expect(chart.queryByRole('status')).not.toBeInTheDocument();
    },
  );

  it('shows a tooltip without changing the license button accessible name', async () => {
    await openStatistics();
    await clickProjectStatisticsTab('details');
    const button = screen.getByRole('button', { name: 'MIT' });
    await userEvent.hover(button);
    expect(await screen.findByRole('tooltip')).toBeVisible();
    expect(button).toHaveAccessibleName('MIT');
  });

  it('opens Audit at the root with only the selected criticality filter', async () => {
    const highId = 'high-navigation-signal';
    const highSignal = {
      packageName: 'high-priority-package',
      licenseName: 'MIT',
      classification: 0,
      criticality: RawCriticality[Criticality.High],
    };
    const mediumId = 'medium-navigation-signal';
    const mediumSignal = {
      packageName: 'medium-priority-package',
      licenseName: 'Apache-2.0',
      classification: 0,
      criticality: RawCriticality[Criticality.Medium],
    };
    const { sendToChannel } = await renderApp({
      data: getParsedInputFileEnrichedWithTestData({
        config: { classifications: { 0: 'Default' } },
        resources: { nested: { 'current.ts': 1 }, 'other.ts': 1 },
        externalAttributions: deserializeAttributions({
          [highId]: highSignal,
          [mediumId]: mediumSignal,
        }),
        resourcesToExternalAttributions: {
          '/nested/current.ts': [mediumId],
          '/other.ts': [highId],
        },
      }),
    });

    await gotoResource('nested', 'current.ts');
    await clickPanelFilterMenuButton(SIGNALS_PANEL);
    await selectFilterMenuDropdown('criticality', 'Medium');
    await selectFilterMenuDropdown('classification', 'Default');
    await closeFilterMenu();
    await fillPanelSearch('signals-panel-header', 'old search');
    await gotoReportView();
    await openProjectStatisticsPopup(sendToChannel);

    await clickStatisticsChartLegend(
      'criticalSignalsCountPieChart',
      text.projectStatisticsPopup.charts.criticalSignalsCountPieChart
        .highlyCritical,
    );

    await expectPopupHidden(PROJECT_STATISTICS_POPUP_LABEL);
    await expectViewIsActive('audit');
    await expectPathBarCrumbs(['Home'], ['nested', 'current.ts']);
    await clickPanelFilterMenuButton(SIGNALS_PANEL);
    await expectFilterMenuDropdownValue('criticality', 'High');
    await expectFilterMenuDropdownValue('classification', '');
    await closeFilterMenu();
    await expectSearchValue('signals-panel-header', '');
    await expectPackageCards(SIGNALS_PANEL, [highSignal], [mediumSignal]);
  });
  it('Needs Review shows only attributions needing review', async () => {
    await openStatistics();
    await clickStatisticsChartLegend('attributionBarChart', 'Needs Review');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [attributions.review],
      [attributions.follow, attributions.first, attributions.complete],
    );
  });

  it('Follow Up shows only follow-up attributions', async () => {
    await openStatistics();
    await clickStatisticsChartLegend('attributionBarChart', 'Follow Up');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [attributions.follow],
      [attributions.review, attributions.first, attributions.complete],
    );
  });

  it('First Party shows only first-party attributions', async () => {
    await openStatistics();
    await clickStatisticsChartLegend('attributionBarChart', 'First Party');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [attributions.first],
      [attributions.review, attributions.follow, attributions.complete],
    );
  });

  it('Total clears the existing attribution filter', async () => {
    const { sendToChannel } = await renderApp({ data: navigationData });
    await applyPanelFilter(ATTRIBUTIONS_PANEL, 'needsFollowUp');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [attributions.follow],
      [attributions.review, attributions.first, attributions.complete],
    );

    await openProjectStatisticsPopup(sendToChannel);
    await clickStatisticsChartLegend(
      'attributionBarChart',
      'Total Attributions',
    );
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [
        attributions.review,
        attributions.follow,
        attributions.first,
        attributions.complete,
      ],
      [],
    );
  });

  it('a license shows only matching signals', async () => {
    await openStatistics();
    await clickStatisticsChartLegend('mostFrequentLicenseCountPieChart', 'MIT');
    await expectPackageCards(
      SIGNALS_PANEL,
      [signals.high],
      [signals.medium, signals.none],
    );
  });

  it('a real license named Other is clickable', async () => {
    await openStatistics();
    await clickStatisticsChartLegend(
      'mostFrequentLicenseCountPieChart',
      'Other',
    );
    await expectPackageCards(
      SIGNALS_PANEL,
      [signals.none],
      [signals.high, signals.medium],
    );
  });

  it('High shows only highly critical signals', async () => {
    await openStatistics();
    await clickStatisticsChartLegend(
      'criticalSignalsCountPieChart',
      'Highly Critical Signals',
    );
    await expectPackageCards(
      SIGNALS_PANEL,
      [signals.high],
      [signals.medium, signals.none],
    );
  });

  it('Medium shows only medium criticality signals', async () => {
    await openStatistics();
    await clickStatisticsChartLegend(
      'criticalSignalsCountPieChart',
      'Medium Critical Signals',
    );
    await expectPackageCards(
      SIGNALS_PANEL,
      [signals.medium],
      [signals.high, signals.none],
    );
  });

  it('None includes numeric-zero criticality signals', async () => {
    await openStatistics();
    await clickStatisticsChartLegend(
      'criticalSignalsCountPieChart',
      'Non-Critical Signals',
    );
    await expectPackageCards(
      SIGNALS_PANEL,
      [signals.none],
      [signals.high, signals.medium],
    );
  });

  it('classification selects signals independently of criticality', async () => {
    await openStatistics();
    await clickStatisticsChartLegend(
      'signalCountByClassificationPieChart',
      'Restricted',
    );
    await expectPackageCards(
      SIGNALS_PANEL,
      [signals.medium, signals.none],
      [signals.high],
    );
  });

  it('classification zero selects signals independently of criticality', async () => {
    await openStatistics();
    await clickStatisticsChartLegend(
      'signalCountByClassificationPieChart',
      'Default',
    );
    await expectPackageCards(
      SIGNALS_PANEL,
      [signals.high],
      [signals.medium, signals.none],
    );
  });

  it('Cancel preserves edits when following a chart link', async () => {
    const { sendToChannel } = await renderApp({ data: navigationData });
    await gotoResource('package.ts');
    await clickPackageCard(ATTRIBUTIONS_PANEL, attributions.review);
    fillFormField('comment', 'unsaved comment');
    await openProjectStatisticsPopup(sendToChannel);
    await clickStatisticsChartLegend('mostFrequentLicenseCountPieChart', 'MIT');
    await clickPopupButton('unsaved changes popup', 'Cancel');
    await expectFormFieldValues({ comment: 'unsaved comment' });
    await expectPackageCards(ATTRIBUTIONS_PANEL, [
      attributions.review,
      attributions.follow,
      attributions.first,
      attributions.complete,
    ]);
  });

  it('Discard follows the chart link and discards edits', async () => {
    const { sendToChannel } = await renderApp({ data: navigationData });
    await gotoResource('package.ts');
    await clickPackageCard(ATTRIBUTIONS_PANEL, attributions.review);
    fillFormField('comment', 'unsaved comment');
    await openProjectStatisticsPopup(sendToChannel);
    await clickStatisticsChartLegend('mostFrequentLicenseCountPieChart', 'MIT');
    await clickPopupButton('unsaved changes popup', 'Discard and Proceed');
    await expectPackageCards(
      SIGNALS_PANEL,
      [signals.high],
      [signals.medium, signals.none],
    );
    await clickPackageCard(ATTRIBUTIONS_PANEL, attributions.review);
    await expectFormFieldValues({ comment: '' });
  });

  it('incomplete-attribution chart entries remain plain text', async () => {
    await openStatistics();
    const chart = within(getStatisticsChart('incompleteAttributionsPieChart'));
    expect(chart.getByText('Complete Attributions')).toBeVisible();
    expect(chart.queryByRole('button')).not.toBeInTheDocument();
    await expectStatisticsChartEntryIsPlainText(
      'attributionBarChart',
      'Incomplete Attributions',
    );
  });

  it('No License remains plain text in criticality and classification legends', async () => {
    const { sendToChannel } = await renderApp({
      data: getParsedInputFileEnrichedWithTestData({
        config: { classifications: { 0: 'Default' } },
        resources: { 'unlicensed.ts': 1 },
        externalAttributions: deserializeAttributions({
          unlicensed: { packageName: 'unlicensed-signal' },
        }),
        resourcesToExternalAttributions: { '/unlicensed.ts': ['unlicensed'] },
      }),
      userSettings: { showCriticality: true, showClassifications: true },
    });
    await openProjectStatisticsPopup(sendToChannel);
    await expectStatisticsChartEntryIsPlainText(
      'criticalSignalsCountPieChart',
      'No License',
    );
    await expectStatisticsChartEntryIsPlainText(
      'signalCountByClassificationPieChart',
      'No License',
    );
  });

  it('aggregate Other remains plain text', async () => {
    const { sendToChannel } = await renderApp({
      data: getParsedInputFileEnrichedWithTestData({
        resources: { 'licenses.ts': 1 },
        externalAttributions: deserializeAttributions({
          mit: { packageName: 'mit-signal', licenseName: 'MIT' },
          apache: { packageName: 'apache-signal', licenseName: 'Apache-2.0' },
          bsd: { packageName: 'bsd-signal', licenseName: 'BSD' },
          isc: { packageName: 'isc-signal', licenseName: 'ISC' },
          mpl: { packageName: 'mpl-signal', licenseName: 'MPL-2.0' },
          zlib: { packageName: 'zlib-signal', licenseName: 'Zlib' },
        }),
        resourcesToExternalAttributions: {
          '/licenses.ts': ['mit', 'apache', 'bsd', 'isc', 'mpl', 'zlib'],
        },
      }),
    });
    await openProjectStatisticsPopup(sendToChannel);
    await expectStatisticsChartEntryIsPlainText(
      'mostFrequentLicenseCountPieChart',
      'Other',
    );
  });
  it('criticality navigation includes licensed and unlicensed signals with matching criticality', async () => {
    const licensed = {
      packageName: 'licensed-high-signal',
      licenseName: 'MIT',
      criticality: 'high',
    };
    const unlicensed = {
      packageName: 'unlicensed-high-signal',
      criticality: 'high',
    };
    const { sendToChannel } = await renderApp({
      data: getParsedInputFileEnrichedWithTestData({
        resources: { 'licenses.ts': 1 },
        externalAttributions: deserializeAttributions({
          licensed,
          unlicensed,
        }),
        resourcesToExternalAttributions: {
          '/licenses.ts': ['licensed', 'unlicensed'],
        },
      }),
      userSettings: { showCriticality: true },
    });
    await openProjectStatisticsPopup(sendToChannel);
    await clickStatisticsChartLegend(
      'criticalSignalsCountPieChart',
      'Highly Critical Signals',
    );
    await expectPackageCards(SIGNALS_PANEL, [licensed, unlicensed]);
  });
});
