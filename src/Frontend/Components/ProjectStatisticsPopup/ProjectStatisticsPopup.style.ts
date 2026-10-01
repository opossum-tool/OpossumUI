// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiPaper from '@mui/material/Paper';

import { OpossumColors, Sizing } from '../../shared-styles';

export const ChartCard = styled(MuiPaper)(({ theme }) => ({
  backgroundColor: OpossumColors.lightestBlue,
  borderRadius: theme.shape.borderRadiusLarge,
  padding: theme.spacing(Sizing.MediumPad),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
}));
