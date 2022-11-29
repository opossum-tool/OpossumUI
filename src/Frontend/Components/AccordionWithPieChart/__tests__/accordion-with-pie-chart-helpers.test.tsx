// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { OpossumColors } from '../../../shared-styles';
import { ProjectStatisticsPopupTitle } from '../../../enums/enums';
import { getColorsForPieChart } from '../AccordionWithPieChart';
import { PieChartData } from '../../../types/types';

describe('getColorsForPieChart', () => {
  it('obtains pie chart colors for critical signals pie chart', () => {
    const expectedPieChartColors = [
      OpossumColors.orange,
      OpossumColors.mediumOrange,
      OpossumColors.darkBlue,
    ];
    const criticalSignalsCount: Array<PieChartData> = [
      {
        name: 'High',
        count: 3,
      },
      {
        name: 'Medium',
        count: 4,
      },
      {
        name: 'Not critical',
        count: 2,
      },
    ];

    const pieChartColors = getColorsForPieChart(
      criticalSignalsCount,
      ProjectStatisticsPopupTitle.CriticalSignalsCountPieChart
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
      ProjectStatisticsPopupTitle.MostFrequentLicenseCountPieChart
    );

    expect(pieChartColors).toEqual(expectedPieChartColors);
  });
});
