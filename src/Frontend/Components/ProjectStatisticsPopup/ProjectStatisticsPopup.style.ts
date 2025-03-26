// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiPaper from '@mui/material/Paper';
import { styled } from '@mui/system';

import { OpossumColors } from '../../shared-styles';

export const ChartCard = styled(MuiPaper)({
  backgroundColor: OpossumColors.lightestBlue,
  borderRadius: '10px',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  flex: 1,
});
