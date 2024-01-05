// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiCircularProgress from '@mui/material/CircularProgress';

import { baseIcon } from '../../shared-styles';

const DEFAULT_SIZE = 16;

const Container = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

interface SpinnerProps {
  size?: number;
}

export function Spinner({ size = DEFAULT_SIZE }: SpinnerProps) {
  return (
    <Container>
      <MuiCircularProgress
        disableShrink
        size={size}
        sx={baseIcon}
        data-testid={'spinner'}
      />
    </Container>
  );
}
