// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import React, { ReactElement } from 'react';
import MuiTypography from '@mui/material/Typography';
import commitInfo from '../../../commitInfo.json';
import { OpossumColors } from '../../shared-styles';

const useStyles = makeStyles({
  commitDisplay: {
    color: OpossumColors.lightBlue,
  },
});

export function CommitInfoDisplay(): ReactElement {
  const classes = useStyles();
  return (
    <MuiTypography variant={'subtitle2'} className={classes.commitDisplay}>
      {commitInfo.commitInfo}
    </MuiTypography>
  );
}
