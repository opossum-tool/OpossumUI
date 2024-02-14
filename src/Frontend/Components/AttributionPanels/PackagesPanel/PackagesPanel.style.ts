// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiTab from '@mui/material/Tab';
import MuiTabs from '@mui/material/Tabs';
import MuiBox from '@mui/system/Box';

import { OpossumColors, TRANSITION } from '../../../shared-styles';

export const ALERT_CONTAINER_HEIGHT = 24;
export const TABS_CONTAINER_HEIGHT = 30;

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
  gap: '4px',
  padding: '4px',
});

export const ButtonGroup = styled(MuiBox)({
  display: 'flex',
  gap: '4px',
});

export const AlertContainer = styled(MuiBox, {
  shouldForwardProp: (name: string) => !['color', 'height'].includes(name),
})<{ color?: string; open: boolean }>(({ color, open }) => ({
  background: color,
  display: 'flex',
  height: open ? ALERT_CONTAINER_HEIGHT : 0,
  justifyContent: 'center',
  overflow: 'hidden',
  transition: TRANSITION,
}));

export const Tabs = styled(MuiTabs)({
  minHeight: 'unset',
  boxShadow:
    '0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px 0px rgba(0,0,0,0.14), 0px 1px 3px 0px rgba(0,0,0,0.12)',
  boxSizing: 'border-box',
  height: TABS_CONTAINER_HEIGHT,
  '& .MuiTabs-indicator': {
    backgroundColor: OpossumColors.darkBlue,
    height: '1px',
  },
});

export const Tab = styled(MuiTab)({
  whiteSpace: 'nowrap',
  minHeight: 'unset',
  padding: '8px',
});
