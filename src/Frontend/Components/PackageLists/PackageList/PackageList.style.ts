// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiBox from '@mui/system/Box';

import { OpossumColors, TRANSITION } from '../../../shared-styles';

export const Panel = styled(MuiBox)({
  flex: 1,
  overflowY: 'auto',
});

export const ActionBarContainer = styled(MuiBox)({
  overflow: 'auto',
  background: OpossumColors.lightBlue,
  position: 'relative',
  zIndex: 2,
  boxShadow:
    '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)',
});

export const ActionBar = styled(MuiBox)({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  gap: '2px',
  padding: '2px 8px',
});

export const ButtonGroup = styled(MuiBox)({
  display: 'flex',
  gap: '2px',
});

export const MessageContainer = styled(MuiBox, {
  shouldForwardProp: (name: string) => !['color', 'height'].includes(name),
})<{ color?: string; height: number }>(({ color, height }) => ({
  background: color,
  display: 'flex',
  height,
  justifyContent: 'center',
  overflow: 'hidden',
  transition: TRANSITION,
}));
