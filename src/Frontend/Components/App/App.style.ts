// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createTheme, styled } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';

import { OpossumColors } from '../../shared-styles';

export const TitleTypography = styled(MuiTypography)({
  color: OpossumColors.mediumGrey,
  opacity: 0.5,
  marginBottom: '200px',
  fontWeight: 900,
  userSelect: 'none',
});

export const TitleContainer = styled(MuiBox)({
  width: '100%',
  height: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

export const ViewContainer = styled(MuiBox)({
  display: 'flex',
  height: '100vh',
  flexDirection: 'column',
  background: OpossumColors.lightGrey,
  backgroundImage: 'url("icons/wave.svg")',
  backgroundPosition: 'bottom',
  backgroundRepeat: 'no-repeat',
});

export const theme = createTheme({
  typography: {
    fontFamily: ['Karla Variable', 'sans-serif'].join(','),
    body1: {
      fontSize: '14px',
      lineHeight: '20px',
    },
    body2: {
      fontSize: '14px',
      lineHeight: '18px',
    },
    caption: {
      fontSize: '12px',
      lineHeight: '20px',
    },
  },
  palette: {
    primary: {
      main: OpossumColors.darkBlue,
    },
    secondary: {
      main: OpossumColors.white,
      contrastText: OpossumColors.darkGrey,
    },
    error: {
      main: OpossumColors.red,
    },
    warning: {
      main: OpossumColors.mediumOrange,
    },
    success: {
      main: OpossumColors.green,
      contrastText: OpossumColors.white,
    },
  },
  components: {
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          color: OpossumColors.lightestBlue,
        },
        colorPrimary: {
          '&.Mui-checked': {
            color: OpossumColors.middleBlue,
          },
        },
        track: {
          opacity: 0.7,
          backgroundColor: OpossumColors.lightestBlue,
          '.Mui-checked.Mui-checked + &': {
            opacity: 0.7,
            backgroundColor: OpossumColors.middleBlue,
          },
        },
      },
    },
  },
});
