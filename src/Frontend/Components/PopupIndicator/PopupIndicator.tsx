// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { styled } from '@mui/material';
import MuiIconButton, {
  IconButtonProps as MuiIconButtonProps,
} from '@mui/material/IconButton';

export const PopupIndicator = styled(
  ({ size = 'small', ...props }: MuiIconButtonProps) => (
    <MuiIconButton aria-label={'popup indicator'} size={size} {...props}>
      <ArrowDropDownIcon />
    </MuiIconButton>
  ),
  { shouldForwardProp: (prop) => prop !== 'popupOpen' },
)<{ popupOpen?: boolean }>(({ popupOpen }) => ({
  padding: '2px',
  transform: popupOpen ? 'rotate(180deg)' : 'rotate(0deg)',
  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
}));
