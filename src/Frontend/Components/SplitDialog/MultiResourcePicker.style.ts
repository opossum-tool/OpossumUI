// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { styled } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiIconButton from '@mui/material/IconButton';
import MuiLinearProgress from '@mui/material/LinearProgress';
import MuiTypography from '@mui/material/Typography';

const INDENT_PER_LEVEL = 6;
const INCLUDED_RESOURCE_OPACITY = 0.7;

export const PickerContainer = styled(MuiBox)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
}));

export const ResourceTreeContainer = styled(MuiBox)(({ theme }) => ({
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '4px',
  height: '360px',
  overflowY: 'auto',
  padding: theme.spacing(2),
  position: 'relative',
}));

export const SelectedPathsContainer = styled(MuiBox)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  minHeight: '24px',
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
    minHeight: '32px',
    opacity: selectedByAncestor ? INCLUDED_RESOURCE_OPACITY : 1,
  }),
);

export const ExpandButton = styled(MuiIconButton)(({ theme }) => ({
  padding: theme.spacing(1),
}));

export const TreeNodeSpacer = styled(MuiBox)({ width: '28px' });

export const SelectionControl = styled(MuiBox)({
  alignSelf: 'stretch',
  aspectRatio: '1',
  display: 'grid',
  minWidth: '34px',
  placeItems: 'center',
  flexShrink: 0,
});

export const ResourceLabel = styled(MuiTypography)(({ theme }) => ({
  marginLeft: theme.spacing(2),
}));
