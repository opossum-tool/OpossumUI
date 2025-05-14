// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { sum } from 'lodash';

import { Criticality } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
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
  description?: string;
  count?: number;
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
  let filesWithManualAttributionsPercent: number =
    (progressBarData.filesWithManualAttributionCount /
      progressBarData.fileCount) *
    100;
  let filesWithOnlyPreselectedAttributionsPercent: number =
    (progressBarData.filesWithOnlyPreSelectedAttributionCount /
      progressBarData.fileCount) *
    100;
  let filesWithOnlyExternalAttributionsPercent: number =
    (progressBarData.filesWithOnlyExternalAttributionCount /
      progressBarData.fileCount) *
    100;
  let filesWithNothingPercent: number =
    100 -
    filesWithManualAttributionsPercent -
    filesWithOnlyPreselectedAttributionsPercent -
    filesWithOnlyExternalAttributionsPercent;

  [
    filesWithManualAttributionsPercent,
    filesWithOnlyPreselectedAttributionsPercent,
    filesWithOnlyExternalAttributionsPercent,
    filesWithNothingPercent,
  ] = roundToAtLeastOnePercentAndNormalize([
    filesWithManualAttributionsPercent,
    filesWithOnlyPreselectedAttributionsPercent,
    filesWithOnlyExternalAttributionsPercent,
    filesWithNothingPercent,
  ]);

  return [
    {
      description:
        text.topBar.switchableProgressBar.attributionBar
          .filesWithManualAttribution,
      count: progressBarData.filesWithManualAttributionCount,
      widthInPercent: filesWithManualAttributionsPercent,
      color: OpossumColors.pastelDarkGreen,
    },
    {
      description:
        text.topBar.switchableProgressBar.attributionBar
          .filesWithOnlyPreSelectedAttribution,
      count: progressBarData.filesWithOnlyPreSelectedAttributionCount,
      widthInPercent: filesWithOnlyPreselectedAttributionsPercent,
      color: OpossumColors.pastelMiddleGreen,
    },
    {
      description:
        text.topBar.switchableProgressBar.attributionBar
          .filesWithOnlyExternalAttribution,
      count: progressBarData.filesWithOnlyExternalAttributionCount,
      widthInPercent: filesWithOnlyExternalAttributionsPercent,
      color: OpossumColors.pastelRed,
    },
    {
      description:
        text.topBar.switchableProgressBar.attributionBar
          .filesWithNeitherAttributionsOrSignals,
      count:
        progressBarData.fileCount -
        progressBarData.filesWithManualAttributionCount -
        progressBarData.filesWithOnlyPreSelectedAttributionCount -
        progressBarData.filesWithOnlyExternalAttributionCount,
      widthInPercent: filesWithNothingPercent,
      color: OpossumColors.lightestBlue,
    },
  ];
}

export function calculateCriticalityBarSteps(
  progressBarData: ProgressBarData,
): Array<ProgressBarStep> {
  if (progressBarData.filesWithOnlyExternalAttributionCount === 0) {
    return [{ widthInPercent: 100, color: OpossumColors.pastelDarkGreen }];
  }

  let filesWithHighlyCriticalExternalAttributionsPercent =
    (progressBarData.filesWithHighlyCriticalExternalAttributionsCount /
      progressBarData.filesWithOnlyExternalAttributionCount) *
    100;
  let filesWithMediumCriticalExternalAttributionsPercent =
    (progressBarData.filesWithMediumCriticalExternalAttributionsCount /
      progressBarData.filesWithOnlyExternalAttributionCount) *
    100;
  let filesWithNonCriticalAttributionsPercent =
    100 -
    filesWithHighlyCriticalExternalAttributionsPercent -
    filesWithMediumCriticalExternalAttributionsPercent;

  [
    filesWithHighlyCriticalExternalAttributionsPercent,
    filesWithMediumCriticalExternalAttributionsPercent,
    filesWithNonCriticalAttributionsPercent,
  ] = roundToAtLeastOnePercentAndNormalize([
    filesWithHighlyCriticalExternalAttributionsPercent,
    filesWithMediumCriticalExternalAttributionsPercent,
    filesWithNonCriticalAttributionsPercent,
  ]);

  return [
    {
      description:
        text.topBar.switchableProgressBar.criticalityBar
          .filesWithHighlyCriticalSignals,
      count: progressBarData.filesWithHighlyCriticalExternalAttributionsCount,
      widthInPercent: filesWithHighlyCriticalExternalAttributionsPercent,
      color: criticalityColor[Criticality.High],
    },
    {
      description:
        text.topBar.switchableProgressBar.criticalityBar
          .filesWithMediumCriticalSignals,
      count: progressBarData.filesWithMediumCriticalExternalAttributionsCount,
      widthInPercent: filesWithMediumCriticalExternalAttributionsPercent,
      color: criticalityColor[Criticality.Medium],
    },
    {
      description:
        text.topBar.switchableProgressBar.criticalityBar
          .filesWithOnlyNonCriticalSignals,
      count:
        progressBarData.filesWithOnlyExternalAttributionCount -
        progressBarData.filesWithHighlyCriticalExternalAttributionsCount -
        progressBarData.filesWithMediumCriticalExternalAttributionsCount,
      widthInPercent: filesWithNonCriticalAttributionsPercent,
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
        description: `${
          text.topBar.switchableProgressBar.classificationBar
            .containingClassification
        } "${statisticsEntry.description.toLowerCase()}"`,
        count: statisticsEntry.correspondingFiles.length,
        widthInPercent:
          (statisticsEntry.correspondingFiles.length * 100) /
          progressBarData.filesWithOnlyExternalAttributionCount,
        color: statisticsEntry.color,
      };
    });

  //add files without classifications
  const numberOfResourcesWithSignalsAndNoAttributionAndClassification = sum(
    Object.values(progressBarData.classificationStatistics).map(
      (entry) => entry.correspondingFiles.length,
    ),
  );
  const numberOfResourcesWithSignalsAndNoAttributionAndNoClassification =
    progressBarData.filesWithOnlyExternalAttributionCount -
    numberOfResourcesWithSignalsAndNoAttributionAndClassification;
  if (numberOfResourcesWithSignalsAndNoAttributionAndNoClassification > 0) {
    const totalPercentage = sum(
      progressBarSteps.map((step) => step.widthInPercent),
    );

    progressBarSteps.push({
      description:
        text.topBar.switchableProgressBar.classificationBar
          .withoutClassification,
      count: numberOfResourcesWithSignalsAndNoAttributionAndNoClassification,
      widthInPercent: 100 - totalPercentage,
      color: classificationUnknownColor,
    });
  }

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
    return { ...progressBarStep, widthInPercent: percentages[index] };
  });
}
