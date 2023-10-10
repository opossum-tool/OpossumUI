// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from 'react';
import MuiTypography from '@mui/material/Typography';
import commitInfo from '../../../commitInfo.json';
import { OpossumColors } from '../../shared-styles';

const classes = {
  commitDisplay: {
    color: OpossumColors.lightBlue,
  },
};

export function CommitInfoDisplay(): ReactElement {
  return (
    <MuiTypography variant={'subtitle2'} sx={classes.commitDisplay}>
      {commitInfo.commitInfo}
    </MuiTypography>
  );
}
