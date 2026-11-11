// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDialogTitle from '@mui/material/DialogTitle';

import { text } from '../../../shared/text';
import { useProcessingStatusUpdated } from '../../util/use-processing-status-updated';
import { Dialog } from '../Dialog/dialog';
import { useProgressPresentation } from '../Dialog/use-progress-presentation';
import { DialogContent, GridLogDisplay } from './ProcessPopup.style';

export function ProcessPopup() {
  const { processingStatusUpdatedEvents, processing } =
    useProcessingStatusUpdated();
  const presentProgress = useProgressPresentation(processing);
  return (
    <Dialog
      open={processing && presentProgress}
      fullWidth
      aria-label={text.processPopup.title}
      data-testid={'progress-dialog'}
    >
      <MuiDialogTitle>{text.processPopup.title}</MuiDialogTitle>
      {renderDialogContent()}
    </Dialog>
  );

  function renderDialogContent() {
    return (
      <DialogContent>
        {processingStatusUpdatedEvents.map((log, index) => (
          <GridLogDisplay
            key={index}
            log={log}
            isInProgress={
              processing && index === processingStatusUpdatedEvents.length - 1
            }
            showDate={true}
          />
        ))}
      </DialogContent>
    );
  }
}
