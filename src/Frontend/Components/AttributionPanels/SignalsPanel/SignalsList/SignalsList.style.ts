// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiTypography from '@mui/material/Typography';

export const GroupName = styled(MuiTypography)(({ theme }) => ({
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  // 0.25 units = 1px vertical nudge for group names
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  marginTop: theme.spacing(0.25),
  userSelect: 'none',
}));
