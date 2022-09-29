// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiSpinner from '@mui/material/CircularProgress';
import MuiBox from '@mui/material/Box';
import { SxProps } from '@mui/material';

const classes = {
  root: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
};

interface SpinnerProps {
  sx?: SxProps;
}

export function Spinner(props: SpinnerProps): ReactElement {
  return (
    <MuiBox sx={{ ...classes.root, ...props.sx }}>
      <MuiSpinner />
    </MuiBox>
  );
}
