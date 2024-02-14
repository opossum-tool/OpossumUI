// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiTooltip from '@mui/material/Tooltip';
import { ReactElement } from 'react';

import { OpossumColors } from '../../shared-styles';
import { ProgressBarData } from '../../types/types';
import {
  getCriticalityBarBackground,
  getCriticalityBarTooltipText,
  getProgressBarBackground,
  getProgressBarTooltipText,
  useOnProgressBarClick,
} from './ProgressBar.util';

const classes = {
  bar: {
    flex: 1,
    border: `2px solid ${OpossumColors.white}`,
    marginTop: '6px',
    height: '20px',
    '&:hover': {
      cursor: 'pointer',
      opacity: 0.75,
    },
  },
};

interface ProgressBarProps {
  sx?: SxProps;
  progressBarData: ProgressBarData;
  showCriticalSignals: boolean;
}

export function ProgressBar(props: ProgressBarProps): ReactElement {
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
  return (
    <MuiBox sx={props.sx}>
      <MuiTooltip
        title={
          props.showCriticalSignals
            ? getCriticalityBarTooltipText(props.progressBarData)
            : getProgressBarTooltipText(props.progressBarData)
        }
        followCursor
      >
        <MuiBox
          aria-label={'ProgressBar'}
          sx={{
            ...classes.bar,
            background: props.showCriticalSignals
              ? getCriticalityBarBackground(props.progressBarData)
              : getProgressBarBackground(props.progressBarData),
          }}
          onClick={
            props.showCriticalSignals
              ? onCriticalityBarClick
              : onProgressBarClick
          }
        />
      </MuiTooltip>
    </MuiBox>
  );
}
