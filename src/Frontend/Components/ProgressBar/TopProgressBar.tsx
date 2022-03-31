// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import React, { ReactElement } from 'react';
import { getProgressBarData } from '../../state/selectors/all-views-resource-selectors';
import { ProgressBarData } from '../../types/types';
import { useAppSelector } from '../../state/hooks';
import { ProgressBar } from './ProgressBar';

const useStyles = makeStyles({
  root: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
});

export function TopProgressBar(): ReactElement {
  const classes = useStyles();
  const progressBarData: ProgressBarData | null =
    useAppSelector(getProgressBarData);

  return progressBarData ? (
    <ProgressBar
      className={classes.root}
      progressBarData={progressBarData}
      label={'TopProgressBar'}
    />
  ) : (
    <div className={classes.root} />
  );
}
