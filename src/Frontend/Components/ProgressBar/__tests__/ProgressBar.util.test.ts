// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../../shared/shared-types';
import { faker } from '../../../../testing/Faker';
import { criticalityColor, OpossumColors } from '../../../shared-styles';
import {
  ClassificationStatistics,
  ProgressBarData,
} from '../../../types/types';
import {
  calculateAttributionBarSteps,
  calculateClassificationBarSteps,
  calculateCriticalityBarSteps,
  classificationUnknownColor,
  createBackgroundFromProgressBarSteps,
  roundToAtLeastOnePercentAndNormalize,
} from '../ProgressBar.util';

describe('ProgressBar helpers', () => {
  describe('createBackgroundFromProgressBarSteps', () => {
    it('gets correct background for attribution bar', () => {
      const testProgressBarData: ProgressBarData = {
        fileCount: 9,
        filesWithManualAttributionCount: 3,
        filesWithOnlyPreSelectedAttributionCount: 3,
        filesWithOnlyExternalAttributionCount: 3,
        resourcesWithNonInheritedExternalAttributionOnly: [
          'file1',
          'file2',
          'file3',
        ],
        filesWithHighlyCriticalExternalAttributionsCount: 1,
        filesWithMediumCriticalExternalAttributionsCount: 2,
        resourcesWithHighlyCriticalExternalAttributions: ['file1'],
        resourcesWithMediumCriticalExternalAttributions: ['file2', 'file3'],
        classificationStatistics: {},
      };
      const expectedProgressBarBackground: string =
        'linear-gradient(to right,' +
        ` ${OpossumColors.pastelDarkGreen} 0% 33% ,` +
        ` ${OpossumColors.pastelMiddleGreen} 33% 66% ,` +
        ` ${OpossumColors.pastelRed} 66% 99% ,` +
        ` ${OpossumColors.lightestBlue} 99% 100% )`;

      const attributionBarSteps =
        calculateAttributionBarSteps(testProgressBarData);
      const actualProgressBarBackground =
        createBackgroundFromProgressBarSteps(attributionBarSteps);
      expect(actualProgressBarBackground).toEqual(
        expectedProgressBarBackground,
      );
    });

    it('gets correct background for criticality bar', () => {
      const testProgressBarData: ProgressBarData = {
        fileCount: 9,
        filesWithManualAttributionCount: 3,
        filesWithOnlyPreSelectedAttributionCount: 3,
        filesWithOnlyExternalAttributionCount: 3,
        resourcesWithNonInheritedExternalAttributionOnly: [
          'file1',
          'file2',
          'file3',
        ],
        filesWithHighlyCriticalExternalAttributionsCount: 1,
        filesWithMediumCriticalExternalAttributionsCount: 1,
        resourcesWithHighlyCriticalExternalAttributions: ['file1'],
        resourcesWithMediumCriticalExternalAttributions: ['file2'],
        classificationStatistics: {},
      };
      const expectedCriticalityBarBackground: string =
        'linear-gradient(to right,' +
        ` ${criticalityColor[Criticality.High]} 0% 34% ,` +
        ` ${criticalityColor[Criticality.Medium]} 34% 67% ,` +
        ` ${OpossumColors.lightestBlue} 67% 100% )`;

      const criticalityBarSteps =
        calculateCriticalityBarSteps(testProgressBarData);
      const actualCriticalityBarBackground =
        createBackgroundFromProgressBarSteps(criticalityBarSteps);
      expect(actualCriticalityBarBackground).toEqual(
        expectedCriticalityBarBackground,
      );
    });

    it('returns correct background color for multiple classifications', () => {
      const classificationStatistics: ClassificationStatistics = {
        0: faker.progressBar.classificationStatisticsEntry({}, 5),
        1: faker.progressBar.classificationStatisticsEntry({}, 3),
        2: faker.progressBar.classificationStatisticsEntry({}, 4),
        3: faker.progressBar.classificationStatisticsEntry({}, 1),
      };
      const testProgressBarData: ProgressBarData = {
        fileCount: 30,
        filesWithManualAttributionCount: 3,
        filesWithOnlyPreSelectedAttributionCount: 3,
        filesWithOnlyExternalAttributionCount: 20,
        resourcesWithNonInheritedExternalAttributionOnly: [],
        filesWithHighlyCriticalExternalAttributionsCount: 1,
        filesWithMediumCriticalExternalAttributionsCount: 1,
        resourcesWithHighlyCriticalExternalAttributions: [],
        resourcesWithMediumCriticalExternalAttributions: [],
        classificationStatistics,
      };

      const classificationBarSteps =
        calculateClassificationBarSteps(testProgressBarData);
      const background = createBackgroundFromProgressBarSteps(
        classificationBarSteps,
      );

      const expectedBackground = `linear-gradient(to right, ${classificationStatistics[3].color} 0% 5% , ${classificationStatistics[2].color} 5% 25% , ${classificationStatistics[1].color} 25% 40% , ${classificationStatistics[0].color} 40% 65% , ${classificationUnknownColor} 65% 100% )`;
      expect(background).toEqual(expectedBackground);
    });

    it('is independent of the ordering of the classification statistics', () => {
      const classificationStatistics: ClassificationStatistics = {
        11: faker.progressBar.classificationStatisticsEntry({}, 1),
        1: faker.progressBar.classificationStatisticsEntry({}, 3),
        2: faker.progressBar.classificationStatisticsEntry({}, 4),
        0: faker.progressBar.classificationStatisticsEntry({}, 5),
      };

      const testProgressBarData: ProgressBarData = {
        fileCount: 30,
        filesWithManualAttributionCount: 3,
        filesWithOnlyPreSelectedAttributionCount: 3,
        filesWithOnlyExternalAttributionCount: 20,
        resourcesWithNonInheritedExternalAttributionOnly: [],
        filesWithHighlyCriticalExternalAttributionsCount: 1,
        filesWithMediumCriticalExternalAttributionsCount: 1,
        resourcesWithHighlyCriticalExternalAttributions: [],
        resourcesWithMediumCriticalExternalAttributions: [],
        classificationStatistics,
      };

      const classificationBarSteps =
        calculateClassificationBarSteps(testProgressBarData);
      const background = createBackgroundFromProgressBarSteps(
        classificationBarSteps,
      );

      const expectedBackground = `linear-gradient(to right, ${classificationStatistics[11].color} 0% 5% , ${classificationStatistics[2].color} 5% 25% , ${classificationStatistics[1].color} 25% 40% , ${classificationStatistics[0].color} 40% 65% , ${classificationUnknownColor} 65% 100% )`;
      expect(background).toEqual(expectedBackground);
    });

    it('returns constant background color for zero files affected', () => {
      const testProgressBarData: ProgressBarData = {
        fileCount: 30,
        filesWithManualAttributionCount: 3,
        filesWithOnlyPreSelectedAttributionCount: 3,
        filesWithOnlyExternalAttributionCount: 0,
        resourcesWithNonInheritedExternalAttributionOnly: [],
        filesWithHighlyCriticalExternalAttributionsCount: 1,
        filesWithMediumCriticalExternalAttributionsCount: 1,
        resourcesWithHighlyCriticalExternalAttributions: [],
        resourcesWithMediumCriticalExternalAttributions: [],
        classificationStatistics: {},
      };

      const classificationBarSteps =
        calculateClassificationBarSteps(testProgressBarData);
      const background = createBackgroundFromProgressBarSteps(
        classificationBarSteps,
      );

      expect(background).toBe('hsl(146, 50%, 55%)');
    });

    it('works for only one classification level configured', () => {
      const classificationStatisticsEntry =
        faker.progressBar.classificationStatisticsEntry({}, 5);
      const testProgressBarData: ProgressBarData = {
        fileCount: 30,
        filesWithManualAttributionCount: 3,
        filesWithOnlyPreSelectedAttributionCount: 3,
        filesWithOnlyExternalAttributionCount: 20,
        resourcesWithNonInheritedExternalAttributionOnly: [],
        filesWithHighlyCriticalExternalAttributionsCount: 1,
        filesWithMediumCriticalExternalAttributionsCount: 1,
        resourcesWithHighlyCriticalExternalAttributions: [],
        resourcesWithMediumCriticalExternalAttributions: [],
        classificationStatistics: { 0: classificationStatisticsEntry },
      };

      const classificationBarSteps =
        calculateClassificationBarSteps(testProgressBarData);
      const background = createBackgroundFromProgressBarSteps(
        classificationBarSteps,
      );

      const expectedBackground = `linear-gradient(to right, ${classificationStatisticsEntry.color} 0% 25% , ${classificationUnknownColor} 25% 100% )`;
      expect(background).toBe(expectedBackground);
    });
  });

  it.each([
    [
      [20.1, 29.9, 0.1, 50.0],
      [20, 30, 1, 49],
    ],
    [
      [0.0, 0.1, 0.9, 99.0],
      [0, 1, 1, 98],
    ],
    [
      [10.0, 0.1, 89.4, 0.1],
      [10, 1, 88, 1],
    ],
    [
      [0, 0, 100.2, 0],
      [0, 0.0, 100, 0],
    ],
    [
      [33, 33, 1, 33],
      [33, 33, 1, 33],
    ],
  ])(
    'roundToAtLeastOnePercentAndNormalize rounds and subtracts difference from the maximum',
    (input: Array<number>, expectedOutput: Array<number>) => {
      expect(roundToAtLeastOnePercentAndNormalize(input)).toEqual(
        expectedOutput,
      );
    },
  );
});
