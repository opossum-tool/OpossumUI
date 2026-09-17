// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { styled } from '@mui/material';
import MuiLinearProgress from '@mui/material/LinearProgress';

export const GroupContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  height: '20px',
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1, 2.5),
  backgroundColor: '#cacfdb',
}));

export const StyledLinearProgress = styled(MuiLinearProgress)({
  position: 'absolute',
  width: '100%',
  height: 2,
  zIndex: 2,
  top: 0,
  left: 0,
});
