// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import type * as Recharts from 'recharts';
import { describe, expect, it, vi } from 'vitest';

import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { Criticality, RawCriticality } from '../shared/shared-types';
import { text } from '../shared/text';
import { renderApp } from './helpers/render-app';
import {
  applyPanelFilter,
  ATTRIBUTIONS_PANEL,
  clickFilterMenuButton,
  clickPackageCard,
  clickPopupButton,
  closeFilterMenu,
  expectFormFieldValues,
  expectPackageCards,
  expectPathBarCrumbs,
  expectPopupHidden,
  expectViewIsActive,
  fillFormField,
  fillPanelSearch,
  gotoReportView,
  gotoResource,
  openProjectStatisticsPopup,
  SIGNALS_PANEL,
} from './helpers/ui';

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

async function clickChartLegend(chartId: string, label: string): Promise<void> {
  await userEvent.click(
    within(screen.getByTestId(chartId)).getByRole('button', { name: label }),
  );
}

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
    await clickFilterMenuButton(screen.getByTestId(SIGNALS_PANEL));
    await userEvent.click(screen.getByLabelText('criticality'));
    await userEvent.click(
      await screen.findByRole('option', { name: 'Medium' }),
    );
    await userEvent.click(screen.getByLabelText('classification'));
    await userEvent.click(
      await screen.findByRole('option', { name: 'Default' }),
    );
    await closeFilterMenu();
    await fillPanelSearch('signals-panel-header', 'old search');
    await gotoReportView();
    await openProjectStatisticsPopup(sendToChannel);

    await clickChartLegend(
      'criticalSignalsCountPieChart',
      text.projectStatisticsPopup.charts.criticalSignalsCountPieChart
        .highlyCritical,
    );

    await expectPopupHidden('project statistics');
    await expectViewIsActive('audit');
    await expectPathBarCrumbs(['Home'], ['nested', 'current.ts']);
    await clickFilterMenuButton(screen.getByTestId(SIGNALS_PANEL));
    expect(screen.getByLabelText('criticality')).toHaveValue('High');
    expect(screen.getByLabelText('classification')).toHaveValue('');
    await closeFilterMenu();
    expect(
      within(screen.getByTestId('signals-panel-header')).getByRole('searchbox'),
    ).toHaveValue('');
    await expectPackageCards(SIGNALS_PANEL, [highSignal], [mediumSignal]);
  });
  it('Needs Review shows only attributions needing review', async () => {
    await openStatistics();
    await clickChartLegend('attributionBarChart', 'Needs Review');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [attributions.review],
      [attributions.follow, attributions.first, attributions.complete],
    );
  });

  it('Follow Up shows only follow-up attributions', async () => {
    await openStatistics();
    await clickChartLegend('attributionBarChart', 'Follow Up');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [attributions.follow],
      [attributions.review, attributions.first, attributions.complete],
    );
  });

  it('First Party shows only first-party attributions', async () => {
    await openStatistics();
    await clickChartLegend('attributionBarChart', 'First Party');
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
    await clickChartLegend('attributionBarChart', 'Total Attributions');
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
    await clickChartLegend('mostFrequentLicenseCountPieChart', 'MIT');
    await expectPackageCards(
      SIGNALS_PANEL,
      [signals.high],
      [signals.medium, signals.none],
    );
  });

  it('a real license named Other is clickable', async () => {
    await openStatistics();
    await clickChartLegend('mostFrequentLicenseCountPieChart', 'Other');
    await expectPackageCards(
      SIGNALS_PANEL,
      [signals.none],
      [signals.high, signals.medium],
    );
  });

  it('High shows only highly critical signals', async () => {
    await openStatistics();
    await clickChartLegend(
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
    await clickChartLegend(
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
    await clickChartLegend(
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
    await clickChartLegend('signalCountByClassificationPieChart', 'Restricted');
    await expectPackageCards(
      SIGNALS_PANEL,
      [signals.medium, signals.none],
      [signals.high],
    );
  });

  it('classification zero selects signals independently of criticality', async () => {
    await openStatistics();
    await clickChartLegend('signalCountByClassificationPieChart', 'Default');
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
    await clickChartLegend('mostFrequentLicenseCountPieChart', 'MIT');
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
    await clickChartLegend('mostFrequentLicenseCountPieChart', 'MIT');
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
    const chart = within(screen.getByTestId('incompleteAttributionsPieChart'));
    expect(chart.getByText('Complete Attributions')).toBeVisible();
    expect(chart.queryByRole('button')).not.toBeInTheDocument();
    const overview = within(screen.getByTestId('attributionBarChart'));
    expect(overview.getByLabelText('Incomplete Attributions')).toBeVisible();
    expect(
      overview.queryByRole('button', { name: 'Incomplete Attributions' }),
    ).not.toBeInTheDocument();
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
    const criticality = within(
      screen.getByTestId('criticalSignalsCountPieChart'),
    );
    expect(criticality.getByText('No License')).toBeVisible();
    expect(
      criticality.queryByRole('button', { name: 'No License' }),
    ).not.toBeInTheDocument();
    const classification = within(
      screen.getByTestId('signalCountByClassificationPieChart'),
    );
    expect(classification.getByText('No License')).toBeVisible();
    expect(
      classification.queryByRole('button', { name: 'No License' }),
    ).not.toBeInTheDocument();
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
    const chart = within(
      screen.getByTestId('mostFrequentLicenseCountPieChart'),
    );
    expect(chart.getByText('Other')).toBeVisible();
    expect(
      chart.queryByRole('button', { name: 'Other' }),
    ).not.toBeInTheDocument();
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
    await clickChartLegend(
      'criticalSignalsCountPieChart',
      'Highly Critical Signals',
    );
    await expectPackageCards(SIGNALS_PANEL, [licensed, unlicensed]);
  });
});
