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
  overflowY: 'hidden',
});

export const ActionBarContainer = styled(MuiBox)(({ theme }) => ({
  overflow: 'auto',
  background: OpossumColors.lightBlue,
  position: 'relative',
  zIndex: 2,
  boxShadow: theme.shadows[1],
}));

export const ActionBar = styled(MuiBox)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
}));

export const ButtonGroup = styled(MuiBox)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
}));

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

export const Tabs = styled(MuiTabs)(({ theme }) => ({
  minHeight: 'unset',
  boxShadow: theme.shadows[1],
  boxSizing: 'border-box',
  height: TABS_CONTAINER_HEIGHT,
  '& .MuiTabs-indicator': {
    backgroundColor: OpossumColors.darkBlue,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- 0.25 theme spacing units (= 1px)
    height: theme.spacing(0.25),
  },
}));

export const Tab = styled(MuiTab)(({ theme }) => ({
  whiteSpace: 'nowrap',
  minHeight: 'unset',
  padding: theme.spacing(2),
}));
