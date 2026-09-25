// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { styled } from '@mui/material';
import MuiLinearProgress from '@mui/material/LinearProgress';

export const GroupContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  height: theme.spacing(5),
  alignItems: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(1, 2.5),
  backgroundColor: '#cacfdb',
}));

export const StyledLinearProgress = styled(MuiLinearProgress)(({ theme }) => ({
  position: 'absolute',
  width: '100%',
  height: theme.spacing(0.5),
  zIndex: 2,
  top: 0,
  left: 0,
}));
