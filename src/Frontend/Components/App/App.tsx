// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createTheme } from '@mui/material';
import MuiBox from '@mui/material/Box';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { ReactElement } from 'react';

import { View } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { useAppSelector } from '../../state/hooks';
import { getSelectedView } from '../../state/selectors/view-selector';
import { useSignalsWorker } from '../../web-workers/use-signals-worker';
import { AttributionView } from '../AttributionView/AttributionView';
import { AuditView } from '../AuditView/AuditView';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary';
import { GlobalPopup } from '../GlobalPopup/GlobalPopup';
import { ProcessPopup } from '../ProcessPopup/ProcessPopup';
import { ReportView } from '../ReportView/ReportView';
import { TopBar } from '../TopBar/TopBar';

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
  palette: {
    primary: {
      main: OpossumColors.darkBlue,
    },
    secondary: {
      main: OpossumColors.white,
    },
    error: {
      main: OpossumColors.red,
    },
    warning: {
      main: OpossumColors.orange,
    },
    success: {
      main: OpossumColors.green,
    },
  },
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

export function App(): ReactElement {
  useSignalsWorker();

  const selectedView = useAppSelector(getSelectedView);

  function getSelectedViewContainer(): ReactElement {
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
          <ProcessPopup />
          <MuiBox sx={classes.root}>
            <TopBar />
            <MuiBox sx={classes.panelDiv}>{getSelectedViewContainer()}</MuiBox>
          </MuiBox>
        </ThemeProvider>
      </StyledEngineProvider>
    </ErrorBoundary>
  );
}
