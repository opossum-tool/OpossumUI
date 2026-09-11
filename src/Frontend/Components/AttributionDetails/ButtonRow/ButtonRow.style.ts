// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiFab from '@mui/material/Fab';
import MuiBox from '@mui/system/Box';

export const Container = styled(MuiBox)({
  display: 'flex',
  gap: '16px',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
  padding: '12px',
});

export const Fab = styled(MuiFab)({
  '&:disabled': {
    opacity: 0.7,
    border: '1px solid currentColor',
  },
});
