// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiTooltip from '@mui/material/Tooltip';
import { ReactElement } from 'react';

import { OpossumColors } from '../../shared-styles';
import { ProgressBarData, ProgressBarType } from '../../types/types';
import {
  getCriticalityBarBackground,
  getCriticalityBarTooltipText,
  getProgressBarBackground,
  getProgressBarTooltipText,
  useOnProgressBarClick,
} from './ProgressBar.util';

const classes = {
  tooltip: {
    fontSize: '12px',
    whiteSpace: 'pre-wrap',
    display: 'flex',
  },
  bar: {
    flex: 1,
    border: `2px solid ${OpossumColors.white}`,
    marginTop: '6px',
    '&:hover': {
      cursor: 'pointer',
      opacity: 0.75,
    },
  },
  folderBar: {
    height: '10px',
  },
  topBar: {
    height: '20px',
  },
};

interface ProgressBarProps {
  sx: SxProps;
  progressBarType: ProgressBarType;
  progressBarData: ProgressBarData;
  progressBarCriticalityState?: boolean;
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
        sx={{ '&.MuiTooltip-tooltip': classes.tooltip }}
        title={
          props.progressBarCriticalityState
            ? getCriticalityBarTooltipText(props.progressBarData)
            : getProgressBarTooltipText(props.progressBarData)
        }
      >
        <MuiBox
          aria-label={props.progressBarType}
          sx={{
            ...classes.bar,
            ...(props.progressBarType === 'FolderProgressBar'
              ? classes.folderBar
              : classes.topBar),
          }}
          style={{
            background: props.progressBarCriticalityState
              ? getCriticalityBarBackground(props.progressBarData)
              : getProgressBarBackground(
                  props.progressBarData,
                  props.progressBarType,
                ),
          }}
          onClick={
            props.progressBarCriticalityState
              ? onCriticalityBarClick
              : onProgressBarClick
          }
        />
      </MuiTooltip>
    </MuiBox>
  );
}
