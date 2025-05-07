// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiTooltip from '@mui/material/Tooltip';
import { sum } from 'lodash';

import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { ProgressBarData, SelectedProgressBar } from '../../types/types';
import {
  calculateAttributionBarSteps,
  calculateClassificationBarSteps,
  calculateCriticalityBarSteps,
  createBackgroundFromProgressBarSteps,
  ProgressBarStep,
  useOnProgressBarClick,
} from './ProgressBar.util';

const classes = {
  bar: {
    flex: 1,
    border: `2px solid ${OpossumColors.white}`,
    marginTop: '2px',
    height: '20px',
    '&:hover': { cursor: 'pointer', opacity: 0.75 },
  },
};

interface ProgressBarProps {
  sx?: SxProps;
  progressBarData: ProgressBarData;
  selectedProgressBar: SelectedProgressBar;
}

export const ProgressBar: React.FC<ProgressBarProps> = (props) => {
  const onAttributionBarClick = useOnProgressBarClick(
    props.progressBarData.resourcesWithNonInheritedExternalAttributionOnly,
  );
  const resourcesWithCriticalExternalAttributions =
    props.progressBarData.resourcesWithHighlyCriticalExternalAttributions.concat(
      props.progressBarData.resourcesWithMediumCriticalExternalAttributions,
    );
  const onCriticalityBarClick = useOnProgressBarClick(
    resourcesWithCriticalExternalAttributions.length > 0
      ? resourcesWithCriticalExternalAttributions
      : props.progressBarData.resourcesWithNonInheritedExternalAttributionOnly,
  );

  let filesToForwardToForCriticality =
    props.progressBarData.resourcesWithNonInheritedExternalAttributionOnly;
  const recordWithHighestClassification = Object.values(
    props.progressBarData.classificationStatistics,
  )
    .reverse()
    .filter((entry) => entry.correspondingFiles.length > 0)[0];
  if (recordWithHighestClassification) {
    filesToForwardToForCriticality =
      recordWithHighestClassification.correspondingFiles;
  }
  const onClassificationBarClick = useOnProgressBarClick(
    filesToForwardToForCriticality,
  );

  const progressBarConfigurations: Record<
    SelectedProgressBar,
    {
      Title: React.FC<ProgressBarData>;
      ariaLabel: string;
      steps: Array<ProgressBarStep>;
      onClickHandler: () => void;
    }
  > = {
    attribution: {
      Title: AttributionBarTooltipTitle,
      ariaLabel: text.topBar.switchableProgressBar.attributionBar.ariaLabel,
      steps: calculateAttributionBarSteps(props.progressBarData),
      onClickHandler: onAttributionBarClick,
    },
    criticality: {
      Title: CriticalityBarTooltipTitle,
      ariaLabel: text.topBar.switchableProgressBar.criticalityBar.ariaLabel,
      steps: calculateCriticalityBarSteps(props.progressBarData),
      onClickHandler: onCriticalityBarClick,
    },
    classification: {
      Title: ClassificationBarTooltipTitle,
      ariaLabel: text.topBar.switchableProgressBar.classificationBar.ariaLabel,
      steps: calculateClassificationBarSteps(props.progressBarData),
      onClickHandler: onClassificationBarClick,
    },
  };

  const { ariaLabel, steps, onClickHandler, Title } =
    progressBarConfigurations[props.selectedProgressBar];

  return (
    <MuiBox sx={props.sx}>
      <MuiTooltip title={<Title {...props.progressBarData} />} followCursor>
        <MuiBox
          aria-label={ariaLabel}
          sx={{
            ...classes.bar,
            background: createBackgroundFromProgressBarSteps(steps),
          }}
          onClick={onClickHandler}
        />
      </MuiTooltip>
    </MuiBox>
  );
};

const ProgressBarTooltipTitle: React.FC<{
  intro: string;
  rows: Array<{ description: string; count: number }>;
}> = ({ intro, rows }) => {
  return (
    <MuiBox>
      {`${intro}…`}
      {rows
        .filter((entry) => !!entry.count)
        .map((entry) => (
          <div key={entry.description}>
            …{entry.description}: {new Intl.NumberFormat().format(entry.count)}
          </div>
        ))}
    </MuiBox>
  );
};

const AttributionBarTooltipTitle: React.FC<ProgressBarData> = (
  progressBarData,
) => {
  return (
    <ProgressBarTooltipTitle
      intro={text.topBar.switchableProgressBar.attributionBar.intro}
      rows={[
        {
          description:
            text.topBar.switchableProgressBar.attributionBar
              .filesWithManualAttribution,
          count: progressBarData.filesWithManualAttributionCount,
        },
        {
          description:
            text.topBar.switchableProgressBar.attributionBar
              .filesWithOnlyPreSelectedAttribution,
          count: progressBarData.filesWithOnlyPreSelectedAttributionCount,
        },
        {
          description:
            text.topBar.switchableProgressBar.attributionBar
              .filesWithOnlyExternalAttribution,
          count: progressBarData.filesWithOnlyExternalAttributionCount,
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
        },
      ]}
    />
  );
};

const CriticalityBarTooltipTitle: React.FC<ProgressBarData> = (
  progressBarData,
) => {
  return (
    <ProgressBarTooltipTitle
      intro={text.topBar.switchableProgressBar.criticalityBar.intro}
      rows={[
        {
          description:
            text.topBar.switchableProgressBar.criticalityBar
              .filesWithHighlyCriticalSignals,
          count:
            progressBarData.filesWithHighlyCriticalExternalAttributionsCount,
        },
        {
          description:
            text.topBar.switchableProgressBar.criticalityBar
              .filesWithMediumCriticalSignals,
          count:
            progressBarData.filesWithMediumCriticalExternalAttributionsCount,
        },
        {
          description:
            text.topBar.switchableProgressBar.criticalityBar
              .filesWithOnlyNonCriticalSignals,
          count:
            progressBarData.filesWithOnlyExternalAttributionCount -
            progressBarData.filesWithHighlyCriticalExternalAttributionsCount -
            progressBarData.filesWithMediumCriticalExternalAttributionsCount,
        },
      ]}
    />
  );
};

const ClassificationBarTooltipTitle: React.FC<ProgressBarData> = (
  progressBarData,
) => {
  const numberOfResourcesWithSignalsAndNoAttributionAndClassification = sum(
    Object.values(progressBarData.classificationStatistics).map(
      (entry) => entry.correspondingFiles.length,
    ),
  );
  const numberOfResourcesWithSignalsAndNoAttributionAndNoClassification =
    progressBarData.filesWithOnlyExternalAttributionCount -
    numberOfResourcesWithSignalsAndNoAttributionAndClassification;

  return (
    <ProgressBarTooltipTitle
      intro={text.topBar.switchableProgressBar.classificationBar.intro}
      rows={[
        ...Object.values(progressBarData.classificationStatistics)
          .toReversed()
          .map((classificationStatisticsEntry) => ({
            description: `${
              text.topBar.switchableProgressBar.classificationBar
                .containingClassification
            } "${classificationStatisticsEntry.description.toLowerCase()}"`,
            count: classificationStatisticsEntry.correspondingFiles.length,
          })),
        ...(numberOfResourcesWithSignalsAndNoAttributionAndNoClassification
          ? [
              {
                description:
                  text.topBar.switchableProgressBar.classificationBar
                    .withoutClassification,
                count:
                  numberOfResourcesWithSignalsAndNoAttributionAndNoClassification,
              },
            ]
          : []),
      ]}
    />
  );
};
