// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ClearIcon from '@mui/icons-material/Clear';
import { styled } from '@mui/material';
import MuiIconButton, {
  IconButtonProps as MuiIconButtonProps,
} from '@mui/material/IconButton';

export const ClearButton = styled(
  ({ size = 'small', ...props }: MuiIconButtonProps) => (
    <MuiIconButton aria-label={'clear button'} size={size} {...props}>
      <ClearIcon fontSize={'small'} />
    </MuiIconButton>
  ),
)({
  padding: '4px',
});
