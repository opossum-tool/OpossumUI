// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-magic-numbers */
import MuiPaper from '@mui/material/Paper';
import { styled } from '@mui/system';

import { OpossumColors } from '../../shared-styles';

export const ChartCard = styled(MuiPaper)(({ theme }) => ({
  backgroundColor: OpossumColors.lightestBlue,
  borderRadius: theme.spacing(2.5),
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
}));
