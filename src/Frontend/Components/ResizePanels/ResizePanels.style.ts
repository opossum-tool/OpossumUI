// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-magic-numbers */
import ClearIcon from '@mui/icons-material/Clear';
import { alpha, styled } from '@mui/material';
import MuiFab from '@mui/material/Fab';
import MuiInputBase from '@mui/material/InputBase';
import MuiPaper from '@mui/material/Paper';
import MuiTypography from '@mui/material/Typography';

import { OpossumColors, TRANSITION } from '../../shared-styles';

export const HEADER_HEIGHT = 32;

export const HeaderIconButton = styled(MuiFab)({
  boxShadow: 'none',
  width: '24px',
  minWidth: '24px',
  height: '24px',
  minHeight: '24px',
  backgroundColor: alpha(OpossumColors.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(OpossumColors.white, 0.25),
  },
  transition: TRANSITION,
});

export const Header = styled(MuiPaper)(({ theme }) => ({
  background: OpossumColors.middleBlue,
  height: HEADER_HEIGHT,
  minHeight: HEADER_HEIGHT,
  position: 'relative',
  zIndex: 3,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(0, 1, 0, 3),
}));

export const HeaderText = styled(MuiTypography)(({ theme }) => ({
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  marginTop: theme.spacing(0.5),
  userSelect: 'none',
  flex: 1,
  color: 'ghostwhite',
}));

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

export const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 1.25),
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const ClearIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 1),
  position: 'absolute',
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const ClearButton = styled(ClearIcon)(({ theme }) => ({
  padding: theme.spacing(0.5),
  borderRadius: '50%',
  cursor: 'pointer',
  '&:hover': {
    background: OpossumColors.lightestGrey,
  },
}));

export const StyledInputBase = styled(MuiInputBase)(({ theme, value }) => ({
  color: 'white',
  maxWidth: '144px',
  height: '24px',
  '& input[type=search]::-webkit-search-cancel-button': { display: 'none' },
  '& .MuiInputBase-input': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    caretColor: 'white',
    paddingRight: value ? theme.spacing(6) : '0px',
    paddingLeft: theme.spacing(6),
    transition: TRANSITION,
    width: value ? '120px' : '0px',
    '&:focus': {
      width: '120px',
    },
  },
}));
