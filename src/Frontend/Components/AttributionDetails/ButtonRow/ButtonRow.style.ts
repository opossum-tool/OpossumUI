// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiFab from '@mui/material/Fab';
import MuiBox from '@mui/system/Box';

import { borderThin, Sizing } from '../../../shared-styles';

export const Container = styled(MuiBox)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(Sizing.Large),
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
  padding: theme.spacing(Sizing.MediumPad),
}));

export const Fab = styled(MuiFab)({
  '&:disabled': {
    opacity: 0.7,
    border: `${borderThin} solid currentColor`,
  },
});
