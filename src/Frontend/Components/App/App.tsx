// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import '@fontsource-variable/karla';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';

import { View } from '../../enums/enums';
import { useAppSelector } from '../../state/hooks';
import { getResources } from '../../state/selectors/resource-selectors';
import { getSelectedView } from '../../state/selectors/view-selector';
import { usePanelSizes } from '../../state/variables/use-panel-sizes';
import { useSignalsWorker } from '../../web-workers/use-signals-worker';
import { AuditView } from '../AuditView/AuditView';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary';
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
  usePanelSizes(); // pre-hydrate size of panels

  return (
    <ErrorBoundary>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <GlobalPopup />
          <ProcessPopup />
          <ViewContainer>
            <TopBar />
            {renderView()}
          </ViewContainer>
        </ThemeProvider>
      </StyledEngineProvider>
    </ErrorBoundary>
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
