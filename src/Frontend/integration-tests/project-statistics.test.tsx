// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { Criticality, RawCriticality } from '../../shared/shared-types';
import { text } from '../../shared/text';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
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
  gotoResource,
  openProjectStatisticsPopup,
  SIGNALS_PANEL,
} from './helpers/ui';

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
