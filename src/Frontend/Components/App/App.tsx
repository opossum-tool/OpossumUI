// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import '@fontsource-variable/karla';
import { ErrorBoundary } from 'react-error-boundary';

import { View } from '../../enums/enums';
import { useAppSelector } from '../../state/hooks';
import { getSelectedView } from '../../state/selectors/view-selector';
import { useInitUserSettings } from '../../state/variables/use-user-setting';
import { useDatabaseInitialized } from '../../util/backendClient';
import {
  ProjectSaveContext,
  useProjectSave,
} from '../../util/use-project-save';
import { AuditView } from '../AuditView/AuditView';
import { ErrorFallback } from '../ErrorFallback/ErrorFallback';
import { GlobalPopup } from '../GlobalPopup/GlobalPopup';
import { MacArchitectureWarning } from '../MacArchitectureWarning/mac-architecture-warning';
import { ProcessPopup } from '../ProcessPopup/ProcessPopup';
import { QuitSaveIndicator } from '../QuitSaveIndicator/QuitSaveIndicator';
import { ReportView } from '../ReportView/ReportView';
import { SaveErrorNotification } from '../SaveErrorNotification/save-error-notification';
import { SaveRecoveryDialog } from '../SaveRecoveryDialog/save-recovery-dialog';
import { TopBar } from '../TopBar/TopBar';
import { UpdateBanner } from '../UpdateBanner/UpdateBanner';
import {
  NotificationRegion,
  TitleContainer,
  TitleTypography,
  ViewContainer,
  Workspace,
} from './App.style';

export function App() {
  //pre-hydrate values
  useInitUserSettings();

  return (
    <ViewContainer>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <GlobalPopup />
        <ProcessPopup />
        <TopBar />
        <NotificationRegion>
          <QuitSaveIndicator />
          <UpdateBanner />
          <SaveErrorNotification />
          <SaveRecoveryDialog />
          <MacArchitectureWarning />
        </NotificationRegion>
        <Workspace>
          <AppView />
        </Workspace>
      </ErrorBoundary>
    </ViewContainer>
  );
}

function AppView(): React.ReactNode {
  const selectedView = useAppSelector(getSelectedView);
  const databaseInitialized = useDatabaseInitialized();
  const saveDraft = useProjectSave(databaseInitialized);

  if (!databaseInitialized) {
    return (
      <TitleContainer>
        <TitleTypography variant={'h1'}>{'OpossumUI'}</TitleTypography>
      </TitleContainer>
    );
  }

  return (
    <ProjectSaveContext value={saveDraft}>
      {selectedView === View.Audit ? <AuditView /> : <ReportView />}
    </ProjectSaveContext>
  );
}
