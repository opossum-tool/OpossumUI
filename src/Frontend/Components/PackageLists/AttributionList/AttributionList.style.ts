// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiChip from '@mui/material/Chip';
import MuiBox from '@mui/system/Box';

export const ChipContainer = styled(MuiBox)({
  display: 'flex',
  flex: 1,
  justifyContent: 'flex-end',
});

export const Chip = styled(MuiChip)(({ theme }) => ({
  textTransform: 'uppercase',
  height: '20px',
  fontSize: theme.typography.caption.fontSize,
  userSelect: 'none',
}));
