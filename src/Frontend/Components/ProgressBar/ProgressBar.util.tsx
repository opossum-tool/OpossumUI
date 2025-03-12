// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
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

export function getProgressBarTooltipText(
  progressBarData: ProgressBarData,
): React.ReactNode {
  return (
    <MuiBox>
      Number of resources…
      <br />
      …with attributions:{' '}
      {new Intl.NumberFormat().format(
        progressBarData.filesWithManualAttributionCount,
      )}
      <br />
      …with only pre-selected attributions:{' '}
      {new Intl.NumberFormat().format(
        progressBarData.filesWithOnlyPreSelectedAttributionCount,
      )}
      <br />
      …with only signals:{' '}
      {new Intl.NumberFormat().format(
        progressBarData.filesWithOnlyExternalAttributionCount,
      )}
    </MuiBox>
  );
}

export function getCriticalityBarTooltipText(
  progressBarData: ProgressBarData,
): React.ReactNode {
  const filesWithNonCriticalExternalAttributions =
    progressBarData.filesWithOnlyExternalAttributionCount -
    progressBarData.filesWithHighlyCriticalExternalAttributionsCount -
    progressBarData.filesWithMediumCriticalExternalAttributionsCount;
  return (
    <MuiBox>
      Number of resources with signals and no attributions…
      <br />
      …containing highly critical signals:{' '}
      {new Intl.NumberFormat().format(
        progressBarData.filesWithHighlyCriticalExternalAttributionsCount,
      )}{' '}
      <br />
      …containing medium critical signals:{' '}
      {new Intl.NumberFormat().format(
        progressBarData.filesWithMediumCriticalExternalAttributionsCount,
      )}{' '}
      <br />
      …containing only non-critical signals:{' '}
      {new Intl.NumberFormat().format(filesWithNonCriticalExternalAttributions)}
    </MuiBox>
  );
}

export function getClassificationBarTooltipText(
  progressBarData: ProgressBarData,
): React.ReactNode {
  const numberOfResourcesWithSignalsAndNoAttributionAndClassification = sum(
    Object.values(progressBarData.classificationStatistics).map(
      (entry) => entry.correspondingFiles.length,
    ),
  );

  const numberOfResourcesWithSignalsAndNoAttributionAndNoClassification =
    progressBarData.filesWithOnlyExternalAttributionCount -
    numberOfResourcesWithSignalsAndNoAttributionAndClassification;
  return (
    <MuiBox>
      Number of resources with signals and no attributions…
      {Object.values(progressBarData.classificationStatistics)
        .toReversed()
        .map((classificationStatisticsEntry) => (
          <div key={classificationStatisticsEntry.description}>
            ...containing classification{' '}
            {classificationStatisticsEntry.description}:{' '}
            {classificationStatisticsEntry.correspondingFiles.length}
          </div>
        ))}
      {numberOfResourcesWithSignalsAndNoAttributionAndNoClassification && (
        <div>
          ...without classification:{' '}
          {numberOfResourcesWithSignalsAndNoAttributionAndNoClassification}
        </div>
      )}
    </MuiBox>
  );
}

export function getProgressBarBackground(
  progressBarData: ProgressBarData,
): string {
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

  const filesWithPreselectedOrManualAttributions: number =
    filesWithManualAttributions + filesWithOnlyPreselectedAttributions;
  const allFilesWithAttributions: number =
    filesWithPreselectedOrManualAttributions +
    filesWithOnlyExternalAttributions;

  return (
    'linear-gradient(to right,' +
    ` ${OpossumColors.pastelDarkGreen} ${filesWithManualAttributions}%,` +
    ` ${OpossumColors.pastelLightGreen} ${filesWithManualAttributions}%,` +
    ` ${OpossumColors.pastelMiddleGreen} ${filesWithPreselectedOrManualAttributions}%,` +
    ` ${OpossumColors.pastelRed} ${filesWithPreselectedOrManualAttributions}% ${allFilesWithAttributions}%,` +
    ` ${OpossumColors.lightestBlue} ${allFilesWithAttributions}%)`
  );
}

export function getCriticalityBarBackground(
  progressBarData: ProgressBarData,
): string {
  if (progressBarData.filesWithOnlyExternalAttributionCount === 0) {
    return `linear-gradient(to right, ${OpossumColors.pastelDarkGreen} 0% 100%)`;
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
  const filesWithHighOrMediumCriticalExternalAttributions: number =
    filesWithHighlyCriticalExternalAttributions +
    filesWithMediumCriticalExternalAttributions;

  return (
    'linear-gradient(to right,' +
    ` ${criticalityColor[Criticality.High]} ${filesWithHighlyCriticalExternalAttributions}%,` +
    ` ${criticalityColor[Criticality.Medium]} ${filesWithHighlyCriticalExternalAttributions}% ${filesWithHighOrMediumCriticalExternalAttributions}%,` +
    ` ${OpossumColors.lightestBlue} ${filesWithHighOrMediumCriticalExternalAttributions}%)`
  );
}

type Color = string;

interface ProgressBarStep {
  widthInPercent: number;
  color: Color;
}

function roundPercentagesToAtLeastOnePercentAndNormalize(
  progressBarSteps: Array<ProgressBarStep>,
): Array<ProgressBarStep> {
  const percentages = roundToAtLeastOnePercentAndNormalize(
    progressBarSteps.map((step) => step.widthInPercent),
  );
  return progressBarSteps.map((progressBarStep, index) => {
    return {
      color: progressBarStep.color,
      widthInPercent: percentages[index],
    };
  });
}

function calculateProgressBarSteps(
  progressBarData: ProgressBarData,
): Array<ProgressBarStep> {
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
    color: OpossumColors.lightestBlue,
  });

  return roundPercentagesToAtLeastOnePercentAndNormalize(progressBarSteps);
}

function createBackgroundFromProgressBarSteps(
  progressBarSteps: Array<ProgressBarStep>,
) {
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

export function getClassificationBarBackground(
  progressBarData: ProgressBarData,
) {
  if (progressBarData.filesWithOnlyExternalAttributionCount === 0) {
    return `${OpossumColors.pastelDarkGreen}`;
  }
  const progressBarSteps = calculateProgressBarSteps(progressBarData);
  return createBackgroundFromProgressBarSteps(progressBarSteps);
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
