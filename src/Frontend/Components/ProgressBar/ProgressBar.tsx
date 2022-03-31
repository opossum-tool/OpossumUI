// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import MuiTooltip from '@mui/material/Tooltip';
import React, { ReactElement } from 'react';
import { ProgressBarData } from '../../types/types';
import { OpossumColors, tooltipStyle } from '../../shared-styles';
import {
  getProgressBarBackground,
  getProgressBarTooltipText,
  useOnProgressBarClick,
} from './progress-bar-helpers';
import clsx from 'clsx';

const useStyles = makeStyles({
  tooltip: {
    ...tooltipStyle,
    whiteSpace: 'pre-wrap',
    display: 'flex',
  },
  bar: {
    flex: 1,
    border: `2px solid ${OpossumColors.white}`,
    marginTop: 6,
    '&:hover': {
      cursor: 'pointer',
      opacity: 0.75,
    },
  },
  folderBar: {
    height: 10,
  },
  topBar: {
    height: 20,
  },
});

interface ProgressBarProps {
  className: string;
  progressBarData: ProgressBarData;
  label: string;
  isFolderProgressBar?: boolean;
}

export function ProgressBar(props: ProgressBarProps): ReactElement {
  const classes = useStyles();

  const onProgressBarClick = useOnProgressBarClick(
    props.progressBarData.resourcesWithNonInheritedSignalOnly
  );

  return (
    <div className={props.className}>
      <MuiTooltip
        classes={{ tooltip: classes.tooltip }}
        title={getProgressBarTooltipText(props.progressBarData)}
      >
        <div
          aria-label={props.label}
          className={clsx(
            classes.bar,
            props.isFolderProgressBar ? classes.folderBar : classes.topBar
          )}
          style={{
            background: getProgressBarBackground(
              props.progressBarData,
              props.isFolderProgressBar
            ),
          }}
          onClick={onProgressBarClick}
        />
      </MuiTooltip>
    </div>
  );
}
