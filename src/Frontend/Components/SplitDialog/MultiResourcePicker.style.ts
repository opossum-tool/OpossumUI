// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiIconButton from '@mui/material/IconButton';
import MuiLinearProgress from '@mui/material/LinearProgress';
import MuiTypography from '@mui/material/Typography';

import { borderThin, Sizing } from '../../shared-styles';

const INDENT_PER_LEVEL = Sizing.Section;
const INCLUDED_RESOURCE_OPACITY = 0.7;

export const PickerContainer = styled(MuiBox)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(Sizing.MediumPad),
}));

export const ResourceTreeContainer = styled(MuiBox)(({ theme }) => ({
  border: `${borderThin} solid`,
  borderColor: 'divider',
  borderRadius: theme.shape.borderRadiusDefault,
  // 90 units = 360px picker height
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  height: theme.spacing(90),
  overflowY: 'auto',
  padding: theme.spacing(Sizing.SmallGap),
  position: 'relative',
}));

export const SelectedPathsContainer = styled(MuiBox)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(Sizing.SmallGap),
  minHeight: theme.spacing(Sizing.Section),
}));

export const LoadingIndicator = styled(MuiLinearProgress)({
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
});

export const ResourceRow = styled(MuiBox, {
  shouldForwardProp: (name: string) =>
    !['resourceLevel', 'selectedByAncestor'].includes(name),
})<{ resourceLevel: number; selectedByAncestor: boolean }>(
  ({ theme, resourceLevel, selectedByAncestor }) => ({
    alignItems: 'center',
    display: 'flex',
    marginLeft: `calc(${theme.spacing(INDENT_PER_LEVEL)} * ${resourceLevel - 1})`,
    // 8 units = 32px selected-paths row height
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    minHeight: theme.spacing(8),
    opacity: selectedByAncestor ? INCLUDED_RESOURCE_OPACITY : 1,
  }),
);

export const ExpandButton = styled(MuiIconButton)(({ theme }) => ({
  padding: theme.spacing(Sizing.Tiny),
}));

export const TreeNodeSpacer = styled(MuiBox)(({ theme }) => ({
  // 7 units = 28px spacer before the expand button
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  width: theme.spacing(7),
}));

export const SelectionControl = styled(MuiBox)(({ theme }) => ({
  alignSelf: 'stretch',
  aspectRatio: '1',
  display: 'grid',
  // 8.5 units = 34px checkbox control minimum width
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  minWidth: theme.spacing(8.5),
  placeItems: 'center',
  flexShrink: 0,
}));

export const ResourceLabel = styled(MuiTypography)(({ theme }) => ({
  marginLeft: theme.spacing(Sizing.SmallGap),
}));
