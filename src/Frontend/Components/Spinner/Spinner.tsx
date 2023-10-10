// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from 'react';
import MuiSpinner from '@mui/material/CircularProgress';
import MuiBox from '@mui/material/Box';
import { SxProps } from '@mui/material';
import { getSxFromPropsAndClasses } from '../../util/get-sx-from-props-and-classes';

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
    <MuiBox
      sx={getSxFromPropsAndClasses({
        styleClass: classes.root,
        sxProps: props.sx,
      })}
    >
      <MuiSpinner />
    </MuiBox>
  );
}
