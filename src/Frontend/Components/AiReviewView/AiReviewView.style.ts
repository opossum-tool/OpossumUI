// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiBox from '@mui/material/Box';

import { borderThin, OpossumColors, Sizing } from '../../shared-styles';

export const ColumnsContainer = styled(MuiBox)({
  width: '100%',
  flex: 1,
  minHeight: 0,
  display: 'flex',
  overflow: 'hidden',
  '& > *': { minWidth: 0, minHeight: 0, overflow: 'auto' },
});

export const DetailsColumn = styled(MuiBox)({
  flex: '1 1 0',
  minWidth: '20%',
  minHeight: 0,
  overflow: 'auto',
});

export const AttributionsColumn = styled(MuiBox)({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: OpossumColors.lightestBlue,
  borderRight: `${borderThin} solid ${OpossumColors.lightBlue}`,
  '& .MuiDivider-root': {
    borderColor: OpossumColors.lightBlue,
  },
});

export const EmptyState = styled(MuiBox)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  textAlign: 'center',
});

export const FilterPills = styled(MuiBox)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  padding: theme.spacing(Sizing.SmallGap),
  flexShrink: 0,
  borderBottom: `${borderThin} solid ${OpossumColors.lightBlue}`,
}));
