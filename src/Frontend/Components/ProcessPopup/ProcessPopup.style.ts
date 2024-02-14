// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Typography } from '@mui/material';
import MuiDialogContent from '@mui/material/DialogContent';
import { styled } from '@mui/system';

export const DialogContent = styled(MuiDialogContent)({
  display: 'grid',
  gridTemplateColumns: '24px 80px 1fr',
  gridTemplateRows: 'repeat(auto-fill, 1fr)',
  columnGap: '8px',
  rowGap: '4px',
});

export const BreakableTypography = styled(Typography)({
  wordBreak: 'break-all',
});
