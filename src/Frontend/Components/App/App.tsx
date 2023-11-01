// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { ReactElement } from 'react';

import { View } from '../../enums/enums';
import { useAppSelector } from '../../state/hooks';
import {
  getIsLoading,
  getSelectedView,
} from '../../state/selectors/view-selector';
import { AttributionView } from '../AttributionView/AttributionView';
import { AuditView } from '../AuditView/AuditView';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary';
import { GlobalPopup } from '../GlobalPopup/GlobalPopup';
import { ReportView } from '../ReportView/ReportView';
import { Spinner } from '../Spinner/Spinner';
import { TopBar } from '../TopBar/TopBar';
import { PanelContainer, RootContainer, theme } from './App.styles';

export function App(): ReactElement {
  const selectedView = useAppSelector(getSelectedView);
  const isLoading = useAppSelector(getIsLoading);

  function getSelectedViewContainer(): ReactElement {
    if (isLoading) {
      return <Spinner sx={{ margin: 'auto' }} />;
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
          <RootContainer>
            <TopBar />
            <PanelContainer>{getSelectedViewContainer()}</PanelContainer>
          </RootContainer>
        </ThemeProvider>
      </StyledEngineProvider>
    </ErrorBoundary>
  );
}
