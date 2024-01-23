// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiBox from '@mui/material/Box';

export const DiffPopupContainer = styled(MuiBox)({
  display: 'flex',
  flexDirection: 'row',
  flex: 1,
  padding: '6px',
  gap: '12px',
  overflow: 'hidden auto',
});
