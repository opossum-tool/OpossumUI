// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiTypography from '@mui/material/Typography';

export const GroupName = styled(MuiTypography)({
  flex: 1,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  marginTop: '1px',
  userSelect: 'none',
});
