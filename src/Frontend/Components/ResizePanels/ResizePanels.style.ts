// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ClearIcon from '@mui/icons-material/Clear';
import { alpha, styled } from '@mui/material';
import MuiFab from '@mui/material/Fab';
import MuiInputBase from '@mui/material/InputBase';
import MuiPaper from '@mui/material/Paper';
import MuiTypography from '@mui/material/Typography';

import { OpossumColors, Sizing, TRANSITION } from '../../shared-styles';

export const HEADER_HEIGHT = 32;

export const HeaderIconButton = styled(MuiFab)(({ theme }) => ({
  boxShadow: 'none',
  width: theme.spacing(Sizing.Section),
  minWidth: theme.spacing(Sizing.Section),
  height: theme.spacing(Sizing.Section),
  minHeight: theme.spacing(Sizing.Section),
  // 0.15/0.25: translucent white overlays
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  backgroundColor: alpha(OpossumColors.white, 0.15),
  '&:hover': {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    backgroundColor: alpha(OpossumColors.white, 0.25),
  },
  transition: TRANSITION,
}));

export const Header = styled(MuiPaper)(({ theme }) => ({
  background: OpossumColors.middleBlue,
  height: HEADER_HEIGHT,
  minHeight: HEADER_HEIGHT,
  position: 'relative',
  zIndex: 3,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(Sizing.Tiny),
  padding: theme.spacing(0, Sizing.Tiny, 0, Sizing.MediumPad),
}));

export const HeaderText = styled(MuiTypography)(({ theme }) => ({
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  // 0.5 units = 2px nudge below the header baseline
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  marginTop: theme.spacing(0.5),
  userSelect: 'none',
  flex: 1,
  color: 'ghostwhite',
}));

export const Search = styled('div')<{ hasValue: boolean }>(
  ({ theme, hasValue }) => ({
    position: 'relative',
    height: theme.spacing(Sizing.Section),
    width: 'auto',
    display: 'flex',
    alignItems: 'center',
    borderRadius: hasValue ? theme.shape.borderRadiusDefault : '50%',
    // 0.15/0.25: translucent white overlays
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    '&:focus-within': {
      borderRadius: theme.shape.borderRadiusDefault,
    },
    transition: TRANSITION,
  }),
);

export const SearchIconWrapper = styled('div')(({ theme }) => ({
  // 1.25 units = 5px padding around the search icon
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  padding: theme.spacing(0, 1.25),
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const ClearIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, Sizing.Tiny),
  position: 'absolute',
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

export const ClearButton = styled(ClearIcon)(({ theme }) => ({
  // 0.5 units = 2px padding around the clear icon
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  padding: theme.spacing(0.5),
  borderRadius: '50%',
  cursor: 'pointer',
  '&:hover': {
    background: OpossumColors.lightestGrey,
  },
}));

export const StyledInputBase = styled(MuiInputBase)(({ theme, value }) => ({
  color: 'white',
  // 36 units = 144px max search width
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  maxWidth: theme.spacing(36),
  height: theme.spacing(Sizing.Section),
  '& input[type=search]::-webkit-search-cancel-button': { display: 'none' },
  '& .MuiInputBase-input': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    caretColor: 'white',
    paddingRight: value ? theme.spacing(Sizing.Section) : '0px',
    paddingLeft: theme.spacing(Sizing.Section),
    transition: TRANSITION,
    // 30 units = 120px expanded search width
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    width: value ? theme.spacing(30) : '0px',
    '&:focus': {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      width: theme.spacing(30),
    },
  },
}));
