// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ClearIcon from '@mui/icons-material/Clear';
import { styled } from '@mui/material';
import MuiIconButton from '@mui/material/IconButton';

import { OpossumColors } from '../../shared-styles';

export const ClearMenuIcon = styled(ClearIcon)({
  color: OpossumColors.darkBlue,
});

export const IconButton = styled(MuiIconButton)({
  '&:hover': {
    background: OpossumColors.lightestGrey,
  },
});
