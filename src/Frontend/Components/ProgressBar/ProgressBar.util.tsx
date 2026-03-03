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
  count: FileWithAttributionsCounts,
): Array<ProgressBarStep> {
  const uncategorizedFiles =
    count.allFiles -
    count.withNonPreSelectedManual -
    count.withOnlyPreSelectedManual -
    count.withOnlyExternal;
  const [
    withNonPreSelectedManualPercent,
    withOnlyPreSelectedPercent,
    withOnlyExternalPercent,
    uncategorizedPercent,
  ] = getNormalizedPercentages([
    count.withNonPreSelectedManual,
    count.withOnlyPreSelectedManual,
    count.withOnlyExternal,
    uncategorizedFiles,
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
      widthInPercent: uncategorizedPercent,
      color: OpossumColors.lightestBlue,
    },
  ];
}

export function calculateCriticalityBarSteps(
  count: FileWithCriticalAttributionsCounts,
): Array<ProgressBarStep> {
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
  ] = getNormalizedPercentages([
    count.withHighlyCritical,
    count.withMediumCritical,
    onlyNonCritical,
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
  count: FileClassifications,
): Array<ProgressBarStep> {
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
    getNormalizedPercentages([
      unclassifiedFiles,
      ...Object.values(count.classificationStatistics)
        .reverse()
        .map((entry) => entry.correspondingFiles.length),
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

  return progressBarSteps;
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
export function getNormalizedPercentages(values: Array<number>): Array<number> {
  const total = sum(values);
  if (total === 0) {
    return values.map(() => 0);
  }
  const percentages = values.map((value) => {
    const percentage = (value / total) * 100;
    return percentage > 0 && percentage < 1 ? 1 : Math.round(percentage);
  });
  const differenceToExpectedSum = sum(percentages) - 100;
  if (differenceToExpectedSum !== 0) {
    const maxIdx = percentages.indexOf(Math.max(...percentages));
    percentages[maxIdx] -= differenceToExpectedSum;
  }
  return percentages;
}
