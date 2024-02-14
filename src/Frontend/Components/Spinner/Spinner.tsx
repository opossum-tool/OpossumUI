// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiCircularProgress from '@mui/material/CircularProgress';
import { SxProps } from '@mui/system';

import { baseIcon } from '../../shared-styles';

const DEFAULT_SIZE = 12;

interface SpinnerProps {
  size?: number;
  sx?: SxProps;
}

export function Spinner({ size = DEFAULT_SIZE, sx }: SpinnerProps) {
  return (
    <MuiCircularProgress
      disableShrink
      size={size}
      sx={{ ...baseIcon, ...sx }}
      data-testid={'spinner'}
    />
  );
}
