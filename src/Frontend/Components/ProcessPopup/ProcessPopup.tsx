// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDialog from '@mui/material/Dialog';
import MuiDialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { text } from '../../../shared/text';
import { useAppSelector } from '../../state/hooks';
import { getOpenPopup } from '../../state/selectors/view-selector';
import {
  BackendProcessingListener,
  useIpcRenderer,
} from '../../util/use-ipc-renderer';
import { useProcessingStatusUpdated } from '../../util/use-processing-status-updated';
import { DialogContent, GridLogDisplay } from './ProcessPopup.style';

export function ProcessPopup() {
  const [isLoading, setIsLoading] = useState(false);
  const isOtherPopupOpen = !!useAppSelector(getOpenPopup);

  useIpcRenderer<BackendProcessingListener>(
    AllowedFrontendChannels.BackendProcessing,
    (_, { isProcessing }) => {
      setIsLoading(isProcessing);
    },
    [],
  );

  const [processingStatusUpdatedEvents] = useProcessingStatusUpdated();

  return (
    <MuiDialog open={isLoading && !isOtherPopupOpen} fullWidth>
      <MuiDialogTitle>{text.processPopup.title}</MuiDialogTitle>
      {renderDialogContent()}
    </MuiDialog>
  );

  function renderDialogContent() {
    return (
      <DialogContent>
        {processingStatusUpdatedEvents.map((log, index) => (
          <GridLogDisplay
            key={index}
            log={log}
            isInProgress={index === processingStatusUpdatedEvents.length - 1}
            showDate={true}
          />
        ))}
      </DialogContent>
    );
  }
}
