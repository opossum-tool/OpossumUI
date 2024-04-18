// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { criticalityColor, OpossumColors } from '../../../shared-styles';
import { ProgressBarWithButtonsData } from '../../../types/types';
import {
  getCriticalityBarBackground,
  getProgressBarBackground,
  roundToAtLeastOnePercentAndNormalize,
} from '../../ProgressBar/ProgressBar.util';

describe('ProgressBar helpers', () => {
  it('getProgressBarBackground returns correct distribution', () => {
    const testProgressBarData: ProgressBarWithButtonsData = {
      count: {
        files: 9,
        filesWithManualAttribution: 3,
        filesWithOnlyPreSelectedAttribution: 3,
        filesWithOnlyExternalAttribution: 3,
        filesWithHighlyCriticalExternalAttributions: 1,
        filesWithMediumCriticalExternalAttributions: 2,
      },
      resources: {
        withNonInheritedExternalAttributionOnly: ['file1', 'file2', 'file3'],
        withHighlyCriticalExternalAttributions: ['file1'],
        withMediumCriticalExternalAttributions: ['file2', 'file3'],
      },
    };
    const expectedProgressBarBackground: string =
      'linear-gradient(to right,' +
      ` ${OpossumColors.pastelDarkGreen} 33%,` +
      ` ${OpossumColors.pastelLightGreen} 33%,` +
      ` ${OpossumColors.pastelMiddleGreen} 66%,` +
      ` ${OpossumColors.pastelRed} 66% 99%,` +
      ` ${OpossumColors.lightestBlue} 99%)`;
    const actualProgressBarBackground = getProgressBarBackground(
      testProgressBarData.count,
    );
    expect(actualProgressBarBackground).toEqual(expectedProgressBarBackground);
  });

  it('getCriticalityBarBackground returns correct distribution', () => {
    const testProgressBarData: ProgressBarWithButtonsData = {
      count: {
        files: 9,
        filesWithManualAttribution: 3,
        filesWithOnlyPreSelectedAttribution: 3,
        filesWithOnlyExternalAttribution: 3,
        filesWithHighlyCriticalExternalAttributions: 1,
        filesWithMediumCriticalExternalAttributions: 1,
      },
      resources: {
        withNonInheritedExternalAttributionOnly: ['file1', 'file2', 'file3'],
        withHighlyCriticalExternalAttributions: ['file1'],
        withMediumCriticalExternalAttributions: ['file2'],
      },
    };
    const expectedCriticalityBarBackground: string =
      'linear-gradient(to right,' +
      ` ${criticalityColor.high} 34%,` +
      ` ${criticalityColor.medium} 34% 67%,` +
      ` ${OpossumColors.lightestBlue} 67%)`;
    const actualCriticalityBarBackground = getCriticalityBarBackground(
      testProgressBarData.count,
    );
    expect(actualCriticalityBarBackground).toEqual(
      expectedCriticalityBarBackground,
    );
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
