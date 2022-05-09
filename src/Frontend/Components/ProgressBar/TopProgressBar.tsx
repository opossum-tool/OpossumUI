// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiBox from '@mui/material/Box';
import React, { ReactElement } from 'react';
import { getProgressBarData } from '../../state/selectors/all-views-resource-selectors';
import { ProgressBarData } from '../../types/types';
import { useAppSelector } from '../../state/hooks';
import { ProgressBar } from './ProgressBar';

const classes = {
  root: {
    flex: 1,
    marginLeft: '12px',
    marginRight: '12px',
  },
};

export function TopProgressBar(): ReactElement {
  const progressBarData: ProgressBarData | null =
    useAppSelector(getProgressBarData);

  return progressBarData ? (
    <ProgressBar
      sx={classes.root}
      progressBarData={progressBarData}
      label={'TopProgressBar'}
    />
  ) : (
    <MuiBox sx={classes.root} />
  );
}
