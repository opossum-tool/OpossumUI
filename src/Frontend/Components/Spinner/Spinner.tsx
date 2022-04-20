// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiSpinner from '@mui/material/CircularProgress';
import MuiBox from '@mui/material/Box';

const classes = {
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
};

export function Spinner(): ReactElement {
  return (
    <MuiBox sx={classes.root}>
      <MuiSpinner />
    </MuiBox>
  );
}
