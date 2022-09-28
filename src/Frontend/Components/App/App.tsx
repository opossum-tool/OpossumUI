// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import React, { ReactElement } from 'react';
import { View } from '../../enums/enums';
import {
  getIsLoading,
  getSelectedView,
} from '../../state/selectors/view-selector';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary';
import { ReportView } from '../ReportView/ReportView';
import { AttributionView } from '../AttributionView/AttributionView';
import { GlobalPopup } from '../GlobalPopup/GlobalPopup';
import { AuditView } from '../AuditView/AuditView';
import { TopBar } from '../TopBar/TopBar';
import { createTheme } from '@mui/material';
import { useAppSelector } from '../../state/hooks';
import MuiBox from '@mui/material/Box';
import { Spinner } from '../Spinner/Spinner';

const classes = {
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
};

const theme = createTheme({
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
  },
});

export function App(): ReactElement {
  const selectedView = useAppSelector(getSelectedView);
  const isLoading = useAppSelector(getIsLoading);

  function getSelectedViewContainer(): ReactElement {
    if (isLoading) {
      return <Spinner sx={classes.spinner} />;
    }

    switch (selectedView) {
      case View.Audit:
        return <AuditView />;
      case View.Attribution:
        return <AttributionView />;
      case View.Report:
        return <ReportView />;
    }
  }

  return (
    <ErrorBoundary>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <GlobalPopup />
          <MuiBox sx={classes.root}>
            <TopBar />
            <MuiBox sx={classes.panelDiv}>{getSelectedViewContainer()}</MuiBox>
          </MuiBox>
        </ThemeProvider>
      </StyledEngineProvider>
    </ErrorBoundary>
  );
}
