// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { alpha, styled } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiChip from '@mui/material/Chip';
import type { SxProps, Theme } from '@mui/material/styles';

import { borderThin, OpossumColors, Sizing } from '../../shared-styles';
import { PanelControlBar } from '../PanelControlBar/panel-control-bar';

export const aiReviewSortButtonStyle: SxProps<Theme> = {
  padding: 0.5,
  color: OpossumColors.white,
  '&:hover': {
    // Match the Resource Tree filter button's translucent white hover.
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    backgroundColor: alpha(OpossumColors.white, 0.15),
  },
};

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

export const FilterPills = styled(PanelControlBar)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(Sizing.Tiny),
  padding: theme.spacing(Sizing.SmallGap),
  flexShrink: 0,
}));

export const FilterPill = styled(MuiChip)(({ theme }) => ({
  fontSize: theme.typography.caption.fontSize,
})) as typeof MuiChip;

export const FilterCount = styled('b')(({ theme }) => ({
  marginInlineStart: theme.spacing(Sizing.Tiny),
  fontVariantNumeric: 'tabular-nums',
}));
