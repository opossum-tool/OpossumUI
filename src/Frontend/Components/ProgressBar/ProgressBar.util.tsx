// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { sum } from 'lodash';

import { criticalityColor, OpossumColors } from '../../shared-styles';
import { navigateToSelectedPathOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getResourceIds,
  getSelectedResourceId,
} from '../../state/selectors/resource-selectors';
import { ProgressBarFileCounts } from '../../types/types';
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
  progressBarData: ProgressBarFileCounts,
): React.ReactNode {
  return (
    <MuiBox>
      Number of resources…
      <br />
      …with attributions:{' '}
      {new Intl.NumberFormat().format(
        progressBarData.filesWithManualAttribution,
      )}
      <br />
      …with only pre-selected attributions:{' '}
      {new Intl.NumberFormat().format(
        progressBarData.filesWithOnlyPreSelectedAttribution,
      )}
      <br />
      …with only signals:{' '}
      {new Intl.NumberFormat().format(
        progressBarData.filesWithOnlyExternalAttribution,
      )}
    </MuiBox>
  );
}

export function getCriticalityBarTooltipText(
  progressBarData: ProgressBarFileCounts,
): React.ReactNode {
  const filesWithNonCriticalExternalAttributions =
    progressBarData.filesWithOnlyExternalAttribution -
    progressBarData.filesWithHighlyCriticalExternalAttributions -
    progressBarData.filesWithMediumCriticalExternalAttributions;
  return (
    <MuiBox>
      Number of resources with signals and no attributions…
      <br />
      …containing highly critical signals:{' '}
      {new Intl.NumberFormat().format(
        progressBarData.filesWithHighlyCriticalExternalAttributions,
      )}{' '}
      <br />
      …containing medium critical signals:{' '}
      {new Intl.NumberFormat().format(
        progressBarData.filesWithMediumCriticalExternalAttributions,
      )}{' '}
      <br />
      …containing only non-critical signals:{' '}
      {new Intl.NumberFormat().format(filesWithNonCriticalExternalAttributions)}
    </MuiBox>
  );
}

export function getProgressBarBackground(
  progressBarData: ProgressBarFileCounts,
): string {
  let filesWithManualAttributions: number =
    (progressBarData.filesWithManualAttribution / progressBarData.files) * 100;
  let filesWithOnlyPreselectedAttributions: number =
    (progressBarData.filesWithOnlyPreSelectedAttribution /
      progressBarData.files) *
    100;
  let filesWithOnlyExternalAttributions: number =
    (progressBarData.filesWithOnlyExternalAttribution / progressBarData.files) *
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
  progressBarData: ProgressBarFileCounts,
): string {
  if (progressBarData.filesWithOnlyExternalAttribution === 0) {
    return `linear-gradient(to right, ${OpossumColors.pastelDarkGreen} 0% 100%)`;
  }
  let filesWithHighlyCriticalExternalAttributions =
    (progressBarData.filesWithHighlyCriticalExternalAttributions /
      progressBarData.filesWithOnlyExternalAttribution) *
    100;
  let filesWithMediumCriticalExternalAttributions =
    (progressBarData.filesWithMediumCriticalExternalAttributions /
      progressBarData.filesWithOnlyExternalAttribution) *
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
