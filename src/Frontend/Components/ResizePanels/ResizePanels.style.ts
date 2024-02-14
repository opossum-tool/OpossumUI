// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-magic-numbers */
import ClearIcon from '@mui/icons-material/Clear';
import { alpha, InputBase, styled } from '@mui/material';
import MuiPaper from '@mui/material/Paper';
import MuiTypography from '@mui/material/Typography';

import { OpossumColors, TRANSITION } from '../../shared-styles';

export const HEADER_HEIGHT = 32;

export const Header = styled(MuiPaper)({
  background: OpossumColors.middleBlue,
  height: HEADER_HEIGHT,
  minHeight: HEADER_HEIGHT,
  position: 'relative',
  zIndex: 3,
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  padding: '0 4px 0 12px',
});

export const HeaderText = styled(MuiTypography)({
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  marginTop: '2px',
  userSelect: 'none',
  flex: 1,
});

export const Search = styled('div')<{ hasValue: boolean }>(
  ({ theme, hasValue }) => ({
    position: 'relative',
    height: '24px',
    width: 'auto',
    display: 'flex',
    alignItems: 'center',
    borderRadius: hasValue ? theme.shape.borderRadius : '50%',
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    '&:focus-within': {
      borderRadius: theme.shape.borderRadius,
    },
    transition: TRANSITION,
  }),
);

export const SearchIconWrapper = styled('div')({
  padding: '0px 6px',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const ClearIconWrapper = styled('div')({
  padding: '0px 4px',
  position: 'absolute',
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const ClearButton = styled(ClearIcon)({
  padding: '2px',
  borderRadius: '50%',
  cursor: 'pointer',
  '&:hover': {
    background: 'rgba(0, 0, 0, 0.04)',
  },
});

export const StyledInputBase = styled(InputBase)(({ value }) => ({
  color: 'white',
  maxWidth: '144px',
  height: '24px',
  '& input[type=search]::-webkit-search-cancel-button': { display: 'none' },
  '& .MuiInputBase-input': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    caretColor: 'white',
    paddingRight: value ? '26px' : '0px',
    paddingLeft: '26px',
    transition: TRANSITION,
    width: value ? '120px' : '0px',
    '&:focus': {
      width: '120px',
    },
  },
}));
