// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ClearIcon from '@mui/icons-material/Clear';
import { styled } from '@mui/material';
import MuiIconButton from '@mui/material/IconButton';

import { OpossumColors } from '../../shared-styles';

export const ClearButton = styled(ClearIcon)({
  padding: '2px',
  borderRadius: '50%',
  cursor: 'pointer',
  '&:hover': {
    background: OpossumColors.lightestGrey,
  },
});

export const IconButton = styled(MuiIconButton, {
  shouldForwardProp: (name: string) => !['isClearHovered'].includes(name),
})<{ isClearHovered: boolean }>(({ isClearHovered }) => ({
  '&:hover': {
    background: isClearHovered ? 'none' : OpossumColors.lightestGrey,
  },
}));
