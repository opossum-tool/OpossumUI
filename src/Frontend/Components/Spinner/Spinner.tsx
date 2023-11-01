// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiSpinner from '@mui/material/CircularProgress';
import { ReactElement } from 'react';

import { StyleProps } from '../../../shared/shared-types';
import { Container } from './Spinner.styles';

type SpinnerProps = StyleProps;

export function Spinner({ className, style, sx }: SpinnerProps): ReactElement {
  return (
    <Container className={className} style={style} sx={sx}>
      <MuiSpinner />
    </Container>
  );
}
