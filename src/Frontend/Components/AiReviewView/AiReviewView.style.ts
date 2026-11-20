// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiBox from '@mui/material/Box';

export const ColumnsContainer = styled(MuiBox)({
  width: '100%',
  flex: 1,
  minHeight: 0,
  display: 'flex',
  overflow: 'hidden',
  '& > *': { minWidth: 0, minHeight: 0, overflow: 'auto' },
  '& > :nth-of-type(1)': { flex: '0 0 30%' },
  '& > :nth-of-type(2)': { flex: '1 1 40%' },
});
