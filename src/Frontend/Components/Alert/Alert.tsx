// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from 'react';
import MuiAlert from '@mui/material/Alert';

interface AlertProps {
  errorMessage: string;
}

export function Alert(props: AlertProps): ReactElement {
  return <MuiAlert severity="error">{props.errorMessage}</MuiAlert>;
}
