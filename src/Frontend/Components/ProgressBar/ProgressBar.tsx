// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from '@material-ui/core/styles';
import MuiTooltip from '@material-ui/core/Tooltip';
import React, { ReactElement } from 'react';
import { useSelector } from 'react-redux';
import { getProgressBarData } from '../../state/selectors/all-views-resource-selectors';
import { ProgressBarData } from '../../types/types';
import { OpossumColors, tooltipStyle } from '../../shared-styles';
import {
  getProgressBarBackground,
  getProgressBarTooltipText,
  useOnProgressBarClick,
} from './progress-bar-helpers';

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
    useSelector(getProgressBarData);

  const onProgressBarClick = useOnProgressBarClick(
    progressBarData?.filesWithSignalOnly || []
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
