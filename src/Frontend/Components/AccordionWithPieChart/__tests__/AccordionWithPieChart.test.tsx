// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { text } from '../../../../shared/text';
import { PieChartCriticalityNames } from '../../../enums/enums';
import { OpossumColors } from '../../../shared-styles';
import { PieChartData } from '../../../types/types';
import { getColorsForPieChart } from '../AccordionWithPieChart';

describe('getColorsForPieChart', () => {
  it('obtains pie chart colors for critical signals pie chart', () => {
    const expectedPieChartColors = [
      OpossumColors.orange,
      OpossumColors.mediumOrange,
      OpossumColors.darkBlue,
    ];
    const criticalSignalsCount: Array<PieChartData> = [
      {
        name: PieChartCriticalityNames.HighCriticality,
        count: 3,
      },
      {
        name: PieChartCriticalityNames.MediumCriticality,
        count: 4,
      },
      {
        name: PieChartCriticalityNames.NoCriticality,
        count: 2,
      },
    ];

    const pieChartColors = getColorsForPieChart(
      criticalSignalsCount,
      text.projectStatisticsPopup.charts.criticalSignalsCountPieChart,
    );

    expect(pieChartColors).toEqual(expectedPieChartColors);
  });

  it('obtains undefined pie chart colors for default case', () => {
    const expectedPieChartColors = undefined;
    const sortedMostFrequentLicenses: Array<PieChartData> = [
      {
        name: 'Apache License Version 2.0',
        count: 3,
      },
      {
        name: 'The MIT License (MIT)',
        count: 3,
      },
    ];

    const pieChartColors = getColorsForPieChart(
      sortedMostFrequentLicenses,
      text.projectStatisticsPopup.charts.mostFrequentLicenseCountPieChart,
    );

    expect(pieChartColors).toEqual(expectedPieChartColors);
  });
});
