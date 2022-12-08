// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiTooltip from '@mui/material/Tooltip';
import React, { ReactElement } from 'react';
import { ProgressBarData, ProgressBarType } from '../../types/types';
import { OpossumColors } from '../../shared-styles';
import {
  getProgressBarBackground,
  getProgressBarTooltipText,
  useOnProgressBarClick,
} from './progress-bar-helpers';
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';

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
}

export function ProgressBar(props: ProgressBarProps): ReactElement {
  const onProgressBarClick = useOnProgressBarClick(
    props.progressBarData.resourcesWithNonInheritedExternalAttributionOnly
  );

  return (
    <MuiBox sx={props.sx}>
      <MuiTooltip
        sx={{ '&.MuiTooltip-tooltip': classes.tooltip }}
        title={getProgressBarTooltipText(props.progressBarData)}
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
            background: getProgressBarBackground(
              props.progressBarData,
              props.progressBarType
            ),
          }}
          onClick={onProgressBarClick}
        />
      </MuiTooltip>
    </MuiBox>
  );
}
