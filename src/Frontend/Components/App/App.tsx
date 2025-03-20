// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import '@fontsource-variable/karla';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { ErrorBoundary } from 'react-error-boundary';

import { View } from '../../enums/enums';
import { useAppSelector } from '../../state/hooks';
import { getResources } from '../../state/selectors/resource-selectors';
import { getSelectedView } from '../../state/selectors/view-selector';
import { useInitialSyncUserSettings } from '../../state/variables/use-user-setting';
import { useSignalsWorker } from '../../web-workers/use-signals-worker';
import { AuditView } from '../AuditView/AuditView';
import { ErrorFallback } from '../ErrorFallback/ErrorFallback';
import { GlobalPopup } from '../GlobalPopup/GlobalPopup';
import { ProcessPopup } from '../ProcessPopup/ProcessPopup';
import { ReportView } from '../ReportView/ReportView';
import { TopBar } from '../TopBar/TopBar';
import {
  theme,
  TitleContainer,
  TitleTypography,
  ViewContainer,
} from './App.style';

export function App() {
  const resources = useAppSelector(getResources);
  const selectedView = useAppSelector(getSelectedView);

  useSignalsWorker();
  //pre-hydrate values
  useInitialSyncUserSettings();

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <ViewContainer>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <GlobalPopup />
            <ProcessPopup />
            <TopBar />
            {renderView()}
          </ErrorBoundary>
        </ViewContainer>
      </ThemeProvider>
    </StyledEngineProvider>
  );

  function renderView() {
    if (!resources) {
      return (
        <TitleContainer>
          <TitleTypography variant={'h1'}>{'OpossumUI'}</TitleTypography>
        </TitleContainer>
      );
    }

    if (selectedView === View.Audit) {
      return <AuditView />;
    }

    return <ReportView />;
  }
}
