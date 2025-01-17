// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import { BarDatum, ResponsiveBar } from '@nivo/bar';

import { criticalityColor, OpossumColors } from '../../shared-styles';
import { ProgressBarData } from '../../types/types';
import {
  CriticalityBarTooltip,
  ProgressBarTooltip,
  useOnProgressBarClick,
} from './ProgressBar.util';

interface ProgressBarProps {
  sx?: SxProps;
  progressBarData: ProgressBarData;
  showCriticalSignals: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = (props) => {
  const onProgressBarClick = useOnProgressBarClick(
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
  const data: Array<BarDatum> = props.showCriticalSignals
    ? [
        {
          highCritical:
            props.progressBarData
              .filesWithHighlyCriticalExternalAttributionsCount,
          mediumCritical:
            props.progressBarData
              .filesWithMediumCriticalExternalAttributionsCount,
          rest:
            props.progressBarData.filesWithOnlyExternalAttributionCount -
            (props.progressBarData
              .filesWithHighlyCriticalExternalAttributionsCount +
              props.progressBarData
                .filesWithMediumCriticalExternalAttributionsCount),
        },
      ]
    : [
        {
          attribution: props.progressBarData.filesWithManualAttributionCount,
          preselected:
            props.progressBarData.filesWithOnlyPreSelectedAttributionCount,
          signals: props.progressBarData.filesWithOnlyExternalAttributionCount,
          rest:
            props.progressBarData.fileCount -
            (props.progressBarData.filesWithManualAttributionCount +
              props.progressBarData.filesWithOnlyPreSelectedAttributionCount +
              props.progressBarData.filesWithOnlyExternalAttributionCount),
        },
      ];

  return (
    <ResponsiveBar
      onMouseEnter={(_datum, event) => {
        event.currentTarget.style.cursor = 'pointer';
      }}
      data={data}
      keys={Object.keys(data[0])}
      margin={{ top: 4, bottom: 4 }}
      maxValue={
        props.showCriticalSignals
          ? props.progressBarData.filesWithOnlyExternalAttributionCount
          : props.progressBarData.fileCount
      }
      layout="horizontal"
      valueScale={{ type: 'linear' }}
      labelSkipWidth={1}
      ariaLabel={'ProgressBar'}
      axisBottom={null}
      axisLeft={null}
      animate={false}
      colors={
        props.showCriticalSignals
          ? [
              criticalityColor.high,
              criticalityColor.medium,
              OpossumColors.lightestBlue,
            ]
          : [
              OpossumColors.pastelDarkGreen,
              OpossumColors.pastelMiddleGreen,
              OpossumColors.pastelRed,
              OpossumColors.lightestBlue,
            ]
      }
      labelTextColor="black"
      tooltip={() =>
        props.showCriticalSignals ? (
          <CriticalityBarTooltip {...props.progressBarData} />
        ) : (
          <ProgressBarTooltip {...props.progressBarData} />
        )
      }
      onClick={
        props.showCriticalSignals ? onCriticalityBarClick : onProgressBarClick
      }
    />
  );
};
