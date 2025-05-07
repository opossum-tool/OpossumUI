// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sum } from 'lodash';

import { Criticality } from '../../../shared/shared-types';
import { criticalityColor, OpossumColors } from '../../shared-styles';
import { navigateToSelectedPathOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getResourceIds,
  getSelectedResourceId,
} from '../../state/selectors/resource-selectors';
import { ProgressBarData } from '../../types/types';
import { moveElementsToEnd } from '../../util/lodash-extension-utils';

type Color = string;

export interface ProgressBarStep {
  widthInPercent: number;
  color: Color;
}

export const classificationUnknownColor = OpossumColors.lightestBlue;

export function useOnProgressBarClick(resourceIds: Array<string>) {
  const dispatch = useAppDispatch();
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const allResourceIds = useAppSelector(getResourceIds);

  return () => {
    if (!resourceIds?.length || !allResourceIds?.length) {
      return;
    }

    dispatch(
      navigateToSelectedPathOrOpenUnsavedPopup(
        moveElementsToEnd(
          allResourceIds,
          allResourceIds.indexOf(selectedResourceId) + 1,
        ).find((resourceId) => resourceIds.includes(resourceId)) ||
          resourceIds[0],
      ),
    );
  };
}

export function calculateAttributionBarSteps(
  progressBarData: ProgressBarData,
): Array<ProgressBarStep> {
  let filesWithManualAttributions: number =
    (progressBarData.filesWithManualAttributionCount /
      progressBarData.fileCount) *
    100;
  let filesWithOnlyPreselectedAttributions: number =
    (progressBarData.filesWithOnlyPreSelectedAttributionCount /
      progressBarData.fileCount) *
    100;
  let filesWithOnlyExternalAttributions: number =
    (progressBarData.filesWithOnlyExternalAttributionCount /
      progressBarData.fileCount) *
    100;
  let filesWithNothing: number =
    100 -
    filesWithManualAttributions -
    filesWithOnlyPreselectedAttributions -
    filesWithOnlyExternalAttributions;

  [
    filesWithManualAttributions,
    filesWithOnlyPreselectedAttributions,
    filesWithOnlyExternalAttributions,
    filesWithNothing,
  ] = roundToAtLeastOnePercentAndNormalize([
    filesWithManualAttributions,
    filesWithOnlyPreselectedAttributions,
    filesWithOnlyExternalAttributions,
    filesWithNothing,
  ]);

  return [
    {
      widthInPercent: filesWithManualAttributions,
      color: OpossumColors.pastelDarkGreen,
    },
    {
      widthInPercent: filesWithOnlyPreselectedAttributions,
      color: OpossumColors.pastelMiddleGreen,
    },
    {
      widthInPercent: filesWithOnlyExternalAttributions,
      color: OpossumColors.pastelRed,
    },
    { widthInPercent: filesWithNothing, color: OpossumColors.lightestBlue },
  ];
}

export function calculateCriticalityBarSteps(
  progressBarData: ProgressBarData,
): Array<ProgressBarStep> {
  if (progressBarData.filesWithOnlyExternalAttributionCount === 0) {
    return [{ widthInPercent: 100, color: OpossumColors.pastelDarkGreen }];
  }

  let filesWithHighlyCriticalExternalAttributions =
    (progressBarData.filesWithHighlyCriticalExternalAttributionsCount /
      progressBarData.filesWithOnlyExternalAttributionCount) *
    100;
  let filesWithMediumCriticalExternalAttributions =
    (progressBarData.filesWithMediumCriticalExternalAttributionsCount /
      progressBarData.filesWithOnlyExternalAttributionCount) *
    100;
  let filesWithNonCriticalAttributions =
    100 -
    filesWithHighlyCriticalExternalAttributions -
    filesWithMediumCriticalExternalAttributions;

  [
    filesWithHighlyCriticalExternalAttributions,
    filesWithMediumCriticalExternalAttributions,
    filesWithNonCriticalAttributions,
  ] = roundToAtLeastOnePercentAndNormalize([
    filesWithHighlyCriticalExternalAttributions,
    filesWithMediumCriticalExternalAttributions,
    filesWithNonCriticalAttributions,
  ]);

  return [
    {
      widthInPercent: filesWithHighlyCriticalExternalAttributions,
      color: criticalityColor[Criticality.High],
    },
    {
      widthInPercent: filesWithMediumCriticalExternalAttributions,
      color: criticalityColor[Criticality.Medium],
    },
    {
      widthInPercent: filesWithNonCriticalAttributions,
      color: OpossumColors.lightestBlue,
    },
  ];
}

export function calculateClassificationBarSteps(
  progressBarData: ProgressBarData,
): Array<ProgressBarStep> {
  if (progressBarData.filesWithOnlyExternalAttributionCount === 0) {
    return [{ widthInPercent: 100, color: OpossumColors.pastelDarkGreen }];
  }

  const classificationStatistics = progressBarData.classificationStatistics;
  const progressBarSteps = Object.values(classificationStatistics)
    .reverse()
    .map<ProgressBarStep>((statisticsEntry) => {
      return {
        widthInPercent:
          (statisticsEntry.correspondingFiles.length * 100) /
          progressBarData.filesWithOnlyExternalAttributionCount,
        color: statisticsEntry.color,
      };
    });
  //add files without classifications
  const totalPercentage = sum(
    progressBarSteps.map((step) => step.widthInPercent),
  );
  progressBarSteps.push({
    widthInPercent: 100 - totalPercentage,
    color: classificationUnknownColor,
  });

  return roundPercentagesToAtLeastOnePercentAndNormalize(progressBarSteps);
}

export function createBackgroundFromProgressBarSteps(
  progressBarSteps: Array<ProgressBarStep>,
) {
  if (progressBarSteps.length === 1) {
    return progressBarSteps[0].color;
  }

  let backgroundColor = 'linear-gradient(to right, ';
  let currentPercentage = 0;
  const backgroundSteps: Array<string> = [];
  for (const progressBarStep of progressBarSteps) {
    backgroundSteps.push(
      `${progressBarStep.color} ${currentPercentage}% ${currentPercentage + progressBarStep.widthInPercent}%`,
    );
    currentPercentage += progressBarStep.widthInPercent;
  }
  backgroundColor += backgroundSteps.join(' , ');
  backgroundColor += ' )';
  return backgroundColor;
}

// We want to round everything > 0 to at least one percent so all possible segments of
// the progress bar are always visible. For example, if there is only one file with
// only signal left, we still want the user to see it even if there are 100,000
// other files.
// Only segments with 0 files should not be there.
export function roundToAtLeastOnePercentAndNormalize(
  numbers: Array<number>,
): Array<number> {
  const roundedNumbers = numbers.map((n) =>
    n > 0 && n < 1 ? 1 : Math.round(n),
  );
  const differenceToExpectedSum = sum(roundedNumbers) - 100;
  if (differenceToExpectedSum !== 0) {
    const maxIdx = roundedNumbers.indexOf(Math.max(...roundedNumbers));
    roundedNumbers[maxIdx] -= differenceToExpectedSum;
  }
  return roundedNumbers;
}

function roundPercentagesToAtLeastOnePercentAndNormalize(
  progressBarSteps: Array<ProgressBarStep>,
): Array<ProgressBarStep> {
  const percentages = roundToAtLeastOnePercentAndNormalize(
    progressBarSteps.map((step) => step.widthInPercent),
  );
  return progressBarSteps.map((progressBarStep, index) => {
    return { color: progressBarStep.color, widthInPercent: percentages[index] };
  });
}
