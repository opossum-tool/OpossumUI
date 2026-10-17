// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { text } from '../../shared/text';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  expectStatisticsCharts,
  openProjectStatisticsPopup,
  sendUserSettingsChange,
} from './helpers/ui';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  packageName: 'a',
  classification: 0,
  criticality: 'medium',
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  packageName: 'b',
  classification: 1,
  criticality: 'high',
});

const data = getParsedInputFileEnrichedWithTestData({
  // Real file parsing refines the config by adding entries for classifications
  // found on attributions; the fixture must configure them explicitly.
  config: { classifications: { 0: 'Readonly', 1: 'Editable' } },
  resources: faker.opossum.resources({
    [resourceName1]: {
      [resourceName2]: {
        [resourceName3]: 1,
      },
    },
    [resourceName4]: 1,
  }),
  externalAttributions: deserializeAttributions({
    [attributionId1]: packageInfo1,
    [attributionId2]: packageInfo2,
  }),
  resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
      attributionId1,
    ],
    [faker.opossum.filePath(resourceName4)]: [attributionId2],
  }),
});

describe('toggling showing classification and criticality', () => {
  it('shows classification and criticality in statistics popup only if selected', async () => {
    const { sendToChannel } = await renderApp({ data });
    await openProjectStatisticsPopup(sendToChannel);
    expectProjectStatisticsTitleVisible();

    await expectStatisticsCharts([
      'criticalSignalsCountPieChart',
      'signalCountByClassificationPieChart',
    ]);
    expectMediumCriticalSignalsLegend();

    // Simulates the View > Show Classifications native menu toggle.
    sendUserSettingsChange(sendToChannel, { showClassifications: false });
    await expectStatisticsCharts(
      ['criticalSignalsCountPieChart'],
      ['signalCountByClassificationPieChart'],
    );

    // Simulates the View > Show Criticality native menu toggle.
    sendUserSettingsChange(sendToChannel, { showCriticality: false });
    await expectStatisticsCharts(
      [],
      ['criticalSignalsCountPieChart', 'signalCountByClassificationPieChart'],
    );
  });
});

function expectMediumCriticalSignalsLegend(): void {
  const chart = screen.getByTestId('criticalSignalsCountPieChart');
  expect(
    within(chart).getByText(
      text.projectStatisticsPopup.charts.criticalSignalsCountPieChart
        .mediumCritical,
    ),
  ).toBeVisible();
}

function expectProjectStatisticsTitleVisible(): void {
  expect(
    within(screen.getByLabelText('project statistics')).getByRole('heading', {
      name: text.projectStatisticsPopup.title,
    }),
  ).toBeVisible();
}
