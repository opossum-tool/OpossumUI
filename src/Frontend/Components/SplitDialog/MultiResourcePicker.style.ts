// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiIconButton from '@mui/material/IconButton';
import MuiLinearProgress from '@mui/material/LinearProgress';
import MuiTypography from '@mui/material/Typography';

const INDENT_PER_LEVEL = '24px';
const INCLUDED_RESOURCE_OPACITY = 0.7;

export const PickerContainer = styled(MuiBox)({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const ResourceTreeContainer = styled(MuiBox)({
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: '4px',
  height: '360px',
  overflowY: 'auto',
  padding: '8px',
  position: 'relative',
});

export const SelectedPathsContainer = styled(MuiBox)({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
});

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
  ({ resourceLevel, selectedByAncestor }) => ({
    alignItems: 'center',
    display: 'flex',
    marginLeft: `calc(${INDENT_PER_LEVEL} * ${resourceLevel - 1})`,
    minHeight: '32px',
    opacity: selectedByAncestor ? INCLUDED_RESOURCE_OPACITY : 1,
  }),
);

export const ExpandButton = styled(MuiIconButton)({ padding: '4px' });

export const TreeNodeSpacer = styled(MuiBox)({ width: '28px' });

export const ResourceLabel = styled(MuiTypography)({ marginLeft: '8px' });
