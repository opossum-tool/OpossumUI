// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiBox from '@mui/material/Box';

export const SIDE_PANEL_MIN_WIDTH = '10%';
export const SIDE_PANEL_MAX_WIDTH = '40%';
const DETAILS_MIN_WIDTH = '20%';

export const PanelColumns = styled(MuiBox)({
  width: '100%',
  flex: 1,
  minHeight: 0,
  display: 'flex',
  overflow: 'hidden',
});

export const DetailsColumn = styled(MuiBox)({
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 0',
  minWidth: DETAILS_MIN_WIDTH,
  minHeight: 0,
  overflow: 'hidden',
});
