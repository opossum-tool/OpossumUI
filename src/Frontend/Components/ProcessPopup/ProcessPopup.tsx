// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDialog from '@mui/material/Dialog';
import MuiDialogTitle from '@mui/material/DialogTitle';
import { useEffect } from 'react';

import { text } from '../../../shared/text';
import { openStatisticsPopupAfterFileLoadIfEnabled } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getOpenPopup } from '../../state/selectors/view-selector';
import { useFrontendPopupOpen } from '../../util/use-app-menu-disabled';
import { usePrevious } from '../../util/use-previous';
import { useProcessingStatusUpdated } from '../../util/use-processing-status-updated';
import { DialogContent, GridLogDisplay } from './ProcessPopup.style';

export function ProcessPopup() {
  const isOtherPopupOpen = !!useAppSelector(getOpenPopup);

  const { processingStatusUpdatedEvents, processing } =
    useProcessingStatusUpdated();

  const showPopup = processing && !isOtherPopupOpen;

  useFrontendPopupOpen(showPopup);

  // Open statistics popup after closing process popup if enabled
  const previouslyShown = usePrevious(showPopup, false);

  const dispatch = useAppDispatch();
  useEffect(() => {
    if (previouslyShown && !showPopup) {
      dispatch(openStatisticsPopupAfterFileLoadIfEnabled);
    }
  }, [previouslyShown, showPopup, dispatch]);

  return (
    <MuiDialog open={showPopup} fullWidth>
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
