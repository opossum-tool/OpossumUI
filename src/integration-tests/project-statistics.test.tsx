// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen, waitFor, within } from '@testing-library/react';
import type { ComponentProps } from 'react';
import type * as Recharts from 'recharts';
import { describe, expect, it, vi } from 'vitest';

import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { Criticality, RawCriticality } from '../shared/shared-types';
import { text } from '../shared/text';
import { faker } from '../testing/Faker';
import { renderApp } from '../testing/render-app';
import {
  ATTRIBUTIONS_PANEL,
  clickAttributionColumnButton,
  clickLicenseTableCell,
  clickLicenseTableColumnHeader,
  clickPackageCard,
  clickProjectStatisticsTab,
  closeProjectStatisticsPopup,
  expectLicenseTableColumnHasSorting,
  expectLicenseTableTotalSignalCountIs,
  expectPackageCards,
  expectPopupHidden,
  expectProjectStatisticsLicenseTableIsVisible,
  expectProjectStatisticsTitleIsVisible,
  expectStatisticsChartContainsText,
  expectStatisticsCharts,
  fillFormField,
  gotoResource,
  openProjectStatisticsPopup,
  saveChangesInAttributionColumn,
  SIGNALS_PANEL,
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

const [resourceName1] = faker.opossum.resourceNames({ count: 1 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  criticality: RawCriticality[Criticality.Medium],
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  criticality: RawCriticality[Criticality.Medium],
});
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  criticality: RawCriticality[Criticality.Medium],
});

const data = getParsedInputFileEnrichedWithTestData({
  config: faker.opossum.inputData().config,
  resources: faker.opossum.resources({
    [resourceName1]: 1,
  }),
  externalAttributions: deserializeAttributions({
    [attributionId1]: packageInfo1,
    [attributionId3]: packageInfo3,
  }),
  resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName1)]: [attributionId1, attributionId3],
  }),
  manualAttributions: deserializeAttributions({
    [attributionId2]: packageInfo2,
  }),
});

describe('project statistics', () => {
  it('opens, displays, and closes project statistics', async () => {
    const { sendToChannel } = await renderApp({ data });
    await openProjectStatisticsPopup(sendToChannel);
    await expectProjectStatisticsTitleIsVisible();
    await closeProjectStatisticsPopup();
  });

  const aiStatesText = text.projectStatisticsPopup.charts.aiAttributionStates;
  const [aiResourceName] = faker.opossum.resourceNames({ count: 1 });
  const [deferredId, deferredPackageInfo] = faker.opossum.rawAttribution({
    criticality: RawCriticality[Criticality.Medium],
    packageName: 'AI deferred',
    aiAttributions: { deferredFields: {} },
  });
  const [deferredModifiedId, deferredModifiedPackageInfo] =
    faker.opossum.rawAttribution({
      criticality: RawCriticality[Criticality.Medium],
      packageName: 'AI deferred modified',
      aiAttributions: { deferredFields: {}, humanModified: true },
    });
  const [aiOutputId, aiOutputPackageInfo] = faker.opossum.rawAttribution({
    criticality: RawCriticality[Criticality.Medium],
    packageName: 'AI output',
    aiAttributions: {},
  });
  const [aiOutputModifiedId, aiOutputModifiedPackageInfo] =
    faker.opossum.rawAttribution({
      criticality: RawCriticality[Criticality.Medium],
      packageName: 'AI output modified',
      aiAttributions: { humanModified: true },
    });
  const [ordinaryId, ordinaryPackageInfo] = faker.opossum.rawAttribution({
    criticality: RawCriticality[Criticality.Medium],
    packageName: 'Ordinary',
  });

  const aiStatisticsData = getParsedInputFileEnrichedWithTestData({
    config: faker.opossum.inputData().config,
    resources: faker.opossum.resources({ [aiResourceName]: 1 }),
    manualAttributions: deserializeAttributions({
      [deferredId]: deferredPackageInfo,
      [deferredModifiedId]: deferredModifiedPackageInfo,
      [aiOutputId]: aiOutputPackageInfo,
      [aiOutputModifiedId]: aiOutputModifiedPackageInfo,
      [ordinaryId]: ordinaryPackageInfo,
    }),
    resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
      [faker.opossum.filePath(aiResourceName)]: [
        deferredId,
        deferredModifiedId,
        aiOutputId,
        aiOutputModifiedId,
        ordinaryId,
      ],
    }),
  });

  it('displays AI attribution states and updates after an edit', async () => {
    const { sendToChannel } = await renderApp({ data: aiStatisticsData });
    await openProjectStatisticsPopup(sendToChannel);
    await expectProjectStatisticsTitleIsVisible();

    const chartTestId = 'aiAttributionStatesBarChart';
    for (const label of [
      aiStatesText.title,
      aiStatesText.count,
      aiStatesText.nonDeferredUnmodified,
      aiStatesText.nonDeferredModified,
      aiStatesText.deferredUnmodified,
      aiStatesText.deferredModified,
      aiStatesText.nonAi,
    ]) {
      await expectStatisticsChartContainsText(chartTestId, label);
    }

    const assertAnnouncedCount = async (label: string, count: number) => {
      const chart = within(screen.getByTestId(chartTestId));
      act(() => chart.getByRole('application').focus());
      await waitFor(() => {
        expect(chart.getByRole('status')).toHaveTextContent(
          `${label}: ${count}`,
        );
      });
    };

    // The accessible status announces the first chart entry.
    await assertAnnouncedCount(aiStatesText.nonDeferredUnmodified, 1);

    await closeProjectStatisticsPopup();

    await gotoResource(aiResourceName);
    await clickPackageCard(ATTRIBUTIONS_PANEL, aiOutputPackageInfo);
    fillFormField('comment', 'Human input');
    await saveChangesInAttributionColumn();

    await openProjectStatisticsPopup(sendToChannel);
    await assertAnnouncedCount(aiStatesText.nonDeferredUnmodified, 0);
    await expectStatisticsChartContainsText(
      chartTestId,
      aiStatesText.deferredModified,
    );
  });

  it('displays bar and pie charts in the overview tab', async () => {
    const { sendToChannel } = await renderApp({ data });
    await openProjectStatisticsPopup(sendToChannel);
    await expectProjectStatisticsTitleIsVisible();

    await expectStatisticsChartContainsText(
      'attributionBarChart',
      text.projectStatisticsPopup.charts.count,
    );
    await expectStatisticsChartContainsText(
      'mostFrequentLicenseCountPieChart',
      packageInfo1.licenseName!,
    );
    await expectStatisticsChartContainsText(
      'criticalSignalsCountPieChart',
      text.projectStatisticsPopup.charts.criticalSignalsCountPieChart
        .mediumCritical,
    );
    await expectStatisticsChartContainsText(
      'incompleteAttributionsPieChart',
      text.projectStatisticsPopup.charts.incompleteAttributionsPieChart
        .completeAttributions,
    );
    await expectStatisticsCharts([
      'attributionBarChart',
      'mostFrequentLicenseCountPieChart',
      'criticalSignalsCountPieChart',
      'signalCountByClassificationPieChart',
      'incompleteAttributionsPieChart',
    ]);
  });

  it('hidden signals are ignored for project statistics', async () => {
    const { sendToChannel } = await renderApp({ data });
    await openProjectStatisticsPopup(sendToChannel);
    await expectProjectStatisticsTitleIsVisible();
    await clickProjectStatisticsTab('details');
    await expectLicenseTableTotalSignalCountIs(2);

    await closeProjectStatisticsPopup();
    await gotoResource(resourceName1);

    await expectPackageCards(SIGNALS_PANEL, [packageInfo1, packageInfo3]);

    await clickPackageCard(SIGNALS_PANEL, packageInfo3);
    await clickAttributionColumnButton('delete');
    await expectPackageCards(SIGNALS_PANEL, [packageInfo1], [packageInfo3]);

    await openProjectStatisticsPopup(sendToChannel);
    await clickProjectStatisticsTab('details');
    await expectLicenseTableTotalSignalCountIs(1);
  });

  it('table sorting is persisted across closing of statistics popup', async () => {
    const { sendToChannel } = await renderApp({ data });
    const criticalityColumnLabel =
      text.attributionCountPerSourcePerLicenseTable.columns.criticality.title;
    const openLicensesTab = async () => {
      await openProjectStatisticsPopup(sendToChannel);
      await clickProjectStatisticsTab('details');
      await expectProjectStatisticsLicenseTableIsVisible();
    };

    await openLicensesTab();

    await clickLicenseTableColumnHeader(criticalityColumnLabel);
    await expectLicenseTableColumnHasSorting(
      criticalityColumnLabel,
      'descending',
    );

    await clickLicenseTableColumnHeader(criticalityColumnLabel);
    await expectLicenseTableColumnHasSorting(
      criticalityColumnLabel,
      'ascending',
    );

    await closeProjectStatisticsPopup();
    await openLicensesTab();

    await expectLicenseTableColumnHasSorting(
      criticalityColumnLabel,
      'ascending',
    );
  });

  it('filter signals for a specific license', async () => {
    const { sendToChannel } = await renderApp({ data });
    await openProjectStatisticsPopup(sendToChannel);
    await expectProjectStatisticsTitleIsVisible();
    await clickProjectStatisticsTab('details');

    const licenseName = packageInfo1.licenseName!;
    await clickLicenseTableCell(licenseName);

    await expectPopupHidden('project statistics');

    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo1],
      [packageInfo2, packageInfo3],
    );
  });
});
