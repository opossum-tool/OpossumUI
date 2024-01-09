// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiBox from '@mui/system/Box';

import { ResizableBox } from '../ResizableBox/ResizableBox';

export const Container = styled(ResizableBox)({
  margin: '5px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

export const ActionBar = styled(MuiBox)({
  border: '1px solid transparent',
  display: 'flex',
  justifyContent: 'space-between',
});

export const ButtonGroup = styled(MuiBox)({
  display: 'flex',
  gap: '4px',
});
