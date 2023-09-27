// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { useState } from 'react';
import { navigateToSelectedPathOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { ProgressBarData, ProgressBarType } from '../../types/types';
import { doNothing } from '../../util/do-nothing';
import { criticalityColor, OpossumColors } from '../../shared-styles';
import { sum } from 'lodash';
import { useAppDispatch } from '../../state/hooks';
import MuiBox from '@mui/material/Box';

export function useOnProgressBarClick(resourceIds: Array<string>): () => void {
  const [numberOfClicks, setNumberOfClicks] = useState(-1);
  const dispatch = useAppDispatch();

  function onProgressBarClick(): void {
    if (!resourceIds.length) {
      return doNothing();
    }

    const newNumberOfClicks = (numberOfClicks + 1) % resourceIds.length;
    setNumberOfClicks(newNumberOfClicks);
    dispatch(
      navigateToSelectedPathOrOpenUnsavedPopup(resourceIds[newNumberOfClicks]),
    );
  }

  return onProgressBarClick;
}

export function getProgressBarTooltipText(
  progressBarData: ProgressBarData,
): React.ReactNode {
  return (
    <MuiBox>
      Number of files: {progressBarData.fileCount}
      <br />
      Files with attributions: {progressBarData.filesWithManualAttributionCount}
      <br />
      Files with only pre-selected attributions:{' '}
      {progressBarData.filesWithOnlyPreSelectedAttributionCount}
      <br />
      Files with only signals:{' '}
      {progressBarData.filesWithOnlyExternalAttributionCount}
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
      Number of files with signals and no attributions (
      {progressBarData.filesWithOnlyExternalAttributionCount}) <br />
      containing highly-critical signals:{' '}
      {progressBarData.filesWithHighlyCriticalExternalAttributionsCount} <br />
      containing medium-critical signals:{' '}
      {progressBarData.filesWithMediumCriticalExternalAttributionsCount} <br />
      containing only non-critical signals:{' '}
      {filesWithNonCriticalExternalAttributions}
    </MuiBox>
  );
}

export function getProgressBarBackground(
  progressBarData: ProgressBarData,
  progressBarType: ProgressBarType,
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
    ` ${
      progressBarType == 'FolderProgressBar'
        ? OpossumColors.almostWhiteBlue
        : OpossumColors.lightestBlue
    } ${allFilesWithAttributions}%)`
  );
}

export function getCriticalityBarBackground(
  progressBarData: ProgressBarData,
): string {
  if (progressBarData.filesWithOnlyExternalAttributionCount === 0) {
    return (
      'linear-gradient(to right,' + ` ${OpossumColors.pastelDarkGreen} 0% 100%)`
    );
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
    ` ${criticalityColor.high} ${filesWithHighlyCriticalExternalAttributions}%,` +
    ` ${criticalityColor.medium} ${filesWithHighlyCriticalExternalAttributions}% ${filesWithHighOrMediumCriticalExternalAttributions}%,` +
    ` ${OpossumColors.lightestBlue} ${filesWithHighOrMediumCriticalExternalAttributions}%)`
  );
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
