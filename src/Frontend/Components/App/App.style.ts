// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createTheme, styled } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';

import { typographyVariants } from '../../app-typography';
import { OpossumColors, Sizing } from '../../shared-styles';

export const TitleTypography = styled(MuiTypography)(({ theme }) => ({
  color: OpossumColors.mediumGrey,
  opacity: 0.5,
  marginBottom: theme.spacing(Sizing.Content),
  fontWeight: 900,
  userSelect: 'none',
}));

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
});

export const theme = createTheme({
  spacing: 4,
  shape: {
    borderRadius: 4,
    borderRadiusSmall: 3,
    borderRadiusDefault: 4,
    borderRadiusMedium: 6,
    borderRadiusLarge: 10,
  },
  typography: typographyVariants,
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
    MuiInputBase: {
      styleOverrides: {
        root: ({ theme }) => ({
          minHeight: `${theme.spacing(Sizing.TopBar)} !important`,
        }),
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          // 1.25 units = 5px toggle-button padding
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          padding: theme.spacing(1.25),
        }),
      },
    },
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
