// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiBox from '@mui/material/Box';
import MuiSpinner from '@mui/material/CircularProgress';
import { ReactElement } from 'react';
import { useStyles } from './Spinner.styles';

interface SpinnerProps {
  className?: string;
}

export function Spinner(props: SpinnerProps): ReactElement {
  const { classes, cx } = useStyles();

  return (
    <MuiBox className={cx(classes.root, props.className)}>
      <MuiSpinner />
    </MuiBox>
  );
}
