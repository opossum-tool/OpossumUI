// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { makeStyles } from 'tss-react/mui';
import { OpossumColors } from '../../shared-styles';
import { createTheme } from '@mui/system';

export const useStyles = makeStyles()({
  root: {
    width: '100vw',
    height: '100vh',
  },
  panelDiv: {
    display: 'flex',
    height: 'calc(100vh - 36px)',
    width: '100%',
    overflow: 'hidden',
  },
  spinner: {
    margin: 'auto',
  },
});

export const theme = createTheme({
  components: {
    MuiTypography: {
      styleOverrides: {
        body1: {
          fontSize: '0.85rem',
          letterSpacing: '0.01071em',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: '0.85rem',
          letterSpacing: '0.01071em',
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.85rem',
          letterSpacing: '0.01071em',
        },
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
