// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import MuiTooltip from '@mui/material/Tooltip';
import React, { ReactElement } from 'react';
import { getProgressBarData } from '../../state/selectors/all-views-resource-selectors';
import { ProgressBarData } from '../../types/types';
import { OpossumColors, tooltipStyle } from '../../shared-styles';
import {
  getProgressBarBackground,
  getProgressBarTooltipText,
  useOnProgressBarClick,
} from './progress-bar-helpers';
import { useAppSelector } from '../../state/hooks';

const useStyles = makeStyles({
  root: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  tooltip: {
    ...tooltipStyle,
    whiteSpace: 'pre-wrap',
    display: 'flex',
  },
  bar: {
    flex: 1,
    border: `2px solid ${OpossumColors.white}`,
    height: 20,
    marginTop: 6,
    '&:hover': {
      cursor: 'pointer',
      opacity: 0.75,
    },
  },
});

export function ProgressBar(): ReactElement {
  const classes = useStyles();
  const progressBarData: ProgressBarData | null =
    useAppSelector(getProgressBarData);

  const onProgressBarClick = useOnProgressBarClick(
    progressBarData?.filesWithNonInheritedSignalOnly || []
  );

  return (
    <div className={classes.root}>
      {progressBarData ? (
        <MuiTooltip
          classes={{ tooltip: classes.tooltip }}
          title={getProgressBarTooltipText(progressBarData)}
        >
          <div
            aria-label={'ProgressBar'}
            className={classes.bar}
            style={{
              background: getProgressBarBackground(progressBarData),
            }}
            onClick={onProgressBarClick}
          />
        </MuiTooltip>
      ) : null}
    </div>
  );
}
