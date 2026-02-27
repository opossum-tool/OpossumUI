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
import {
  FileClassifications,
  FileWithAttributionsCounts,
  FileWithCriticalAttributionsCounts,
} from '../../types/types';
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
  count: FileWithAttributionsCounts | undefined,
): Array<ProgressBarStep> {
  if (!count) {
    return [];
  }
  const uncategorizedFiles =
    count.allFiles -
    count.withNonPreSelectedManual -
    count.withOnlyPreSelectedManual -
    count.withOnlyExternal;
  const [
    withNonPreSelectedManualPercent,
    withOnlyPreSelectedPercent,
    withOnlyExternalPercent,
    leftoverPercent,
  ] = roundToAtLeastOnePercentAndNormalize([
    (count.withNonPreSelectedManual / count.allFiles) * 100,
    (count.withOnlyPreSelectedManual / count.allFiles) * 100,
    (count.withOnlyExternal / count.allFiles) * 100,
    (uncategorizedFiles / count.allFiles) * 100,
  ]);

  return [
    {
      description:
        text.topBar.switchableProgressBar.attributionBar
          .filesWithManualAttribution,
      count: count.withNonPreSelectedManual,
      widthInPercent: withNonPreSelectedManualPercent,
      color: OpossumColors.pastelDarkGreen,
    },
    {
      description:
        text.topBar.switchableProgressBar.attributionBar
          .filesWithOnlyPreSelectedAttribution,
      count: count.withOnlyPreSelectedManual,
      widthInPercent: withOnlyPreSelectedPercent,
      color: OpossumColors.pastelMiddleGreen,
    },
    {
      description:
        text.topBar.switchableProgressBar.attributionBar
          .filesWithOnlyExternalAttribution,
      count: count.withOnlyExternal,
      widthInPercent: withOnlyExternalPercent,
      color: OpossumColors.pastelRed,
    },
    {
      description:
        text.topBar.switchableProgressBar.attributionBar
          .filesWithNeitherAttributionsOrSignals,
      count: uncategorizedFiles,
      widthInPercent: leftoverPercent,
      color: OpossumColors.lightestBlue,
    },
  ];
}

export function calculateCriticalityBarSteps(
  count: FileWithCriticalAttributionsCounts | undefined,
): Array<ProgressBarStep> {
  if (!count) {
    return [];
  }
  if (count.withOnlyExternal === 0) {
    return [{ widthInPercent: 100, color: OpossumColors.pastelDarkGreen }];
  }
  const onlyNonCritical =
    count.withOnlyExternal -
    count.withHighlyCritical -
    count.withMediumCritical;
  const [
    withHighlyCriticalPercent,
    withMediumCriticalPercent,
    onlyNonCriticalPercent,
  ] = roundToAtLeastOnePercentAndNormalize([
    (count.withHighlyCritical / count.withOnlyExternal) * 100,
    (count.withMediumCritical / count.withOnlyExternal) * 100,
    (onlyNonCritical / count.withOnlyExternal) * 100,
  ]);

  return [
    {
      description:
        text.topBar.switchableProgressBar.criticalityBar
          .filesWithHighlyCriticalSignals,
      count: count.withHighlyCritical,
      widthInPercent: withHighlyCriticalPercent,
      color: criticalityColor[Criticality.High],
    },
    {
      description:
        text.topBar.switchableProgressBar.criticalityBar
          .filesWithMediumCriticalSignals,
      count: count.withMediumCritical,
      widthInPercent: withMediumCriticalPercent,
      color: criticalityColor[Criticality.Medium],
    },
    {
      description:
        text.topBar.switchableProgressBar.criticalityBar
          .filesWithOnlyNonCriticalSignals,
      count: onlyNonCritical,
      widthInPercent: onlyNonCriticalPercent,
      color: OpossumColors.lightestBlue,
    },
  ];
}

export function calculateClassificationBarSteps(
  count: FileClassifications | undefined,
): Array<ProgressBarStep> {
  if (!count) {
    return [];
  }
  if (count.withOnlyExternal === 0) {
    return [{ widthInPercent: 100, color: OpossumColors.pastelDarkGreen }];
  }

  const unclassifiedFiles =
    count.withOnlyExternal -
    sum(
      Object.values(count.classificationStatistics).map(
        (entry) => entry.correspondingFiles.length,
      ),
    );
  const [unclassifiedPercentage, ...classificationPercentages] =
    roundToAtLeastOnePercentAndNormalize([
      (unclassifiedFiles / count.withOnlyExternal) * 100,
      ...Object.values(count.classificationStatistics)
        .reverse()
        .map(
          (entry) =>
            (entry.correspondingFiles.length / count.withOnlyExternal) * 100,
        ),
    ]);
  const progressBarSteps = Object.values(count.classificationStatistics)
    .reverse()
    .map<ProgressBarStep>((statisticsEntry, index) => {
      return {
        description: `${
          text.topBar.switchableProgressBar.classificationBar
            .containingClassification
        } "${statisticsEntry.description.toLowerCase()}"`,
        count: statisticsEntry.correspondingFiles.length,
        widthInPercent: classificationPercentages[index],
        color: statisticsEntry.color,
      };
    });

  //add files without classifications
  if (unclassifiedFiles > 0) {
    progressBarSteps.push({
      description:
        text.topBar.switchableProgressBar.classificationBar
          .withoutClassification,
      count: unclassifiedFiles,
      widthInPercent: unclassifiedPercentage,
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
