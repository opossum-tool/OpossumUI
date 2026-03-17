// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import '@fontsource-variable/karla';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { ErrorBoundary } from 'react-error-boundary';

import { View } from '../../enums/enums';
import { useAppSelector } from '../../state/hooks';
import { getSelectedView } from '../../state/selectors/view-selector';
import { useInitUserSettings } from '../../state/variables/use-user-setting';
import { useDatabaseInitialized } from '../../util/backendClient';
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
  //pre-hydrate values
  useInitUserSettings();

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <ViewContainer>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <GlobalPopup />
            <ProcessPopup />
            <TopBar />
            <AppView />
          </ErrorBoundary>
        </ViewContainer>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

function AppView(): React.ReactNode {
  const selectedView = useAppSelector(getSelectedView);
  const databaseInitialized = useDatabaseInitialized();
  if (!databaseInitialized) {
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
