// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDialog from '@mui/material/Dialog';
import MuiDialogTitle from '@mui/material/DialogTitle';

import { text } from '../../../shared/text';
import { useAppSelector } from '../../state/hooks';
import { getOpenPopup } from '../../state/selectors/view-selector';
import { useProcessingStatusUpdated } from '../../util/use-processing-status-updated';
import { DialogContent, GridLogDisplay } from './ProcessPopup.style';

export function ProcessPopup() {
  const isOtherPopupOpen = !!useAppSelector(getOpenPopup);

  const { processingStatusUpdatedEvents, processing } =
    useProcessingStatusUpdated();
  return (
    <MuiDialog open={processing && !isOtherPopupOpen} fullWidth>
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
