// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';

import { text } from '../../../shared/text';
import {
  closePopupAndUnsetTargets,
  proceedFromUnsavedPopup,
} from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getQuitAppRequested } from '../../state/selectors/view-selector';
import { useGlobalPopupId } from '../GlobalPopup/popup-close-context';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export function NotSavedPopup() {
  const dispatch = useAppDispatch();
  const popupId = useGlobalPopupId();
  const quitAppRequested = useAppSelector(getQuitAppRequested);
  const [isQuitting, setIsQuitting] = useState(false);

  const handleProceed = (): void => {
    if (quitAppRequested) {
      setIsQuitting(true);
    }
    void dispatch(proceedFromUnsavedPopup(popupId));
  };

  return (
    <NotificationPopup
      header={text.unsavedChangesPopup.title}
      leftButtonConfig={{
        onClick: handleProceed,
        buttonText: quitAppRequested
          ? text.unsavedChangesPopup.discardAndQuit
          : text.unsavedChangesPopup.discard,
        color: 'secondary',
        disabled: isQuitting,
        loading: isQuitting,
      }}
      rightButtonConfig={{
        onClick: () => dispatch(closePopupAndUnsetTargets(popupId)),
        buttonText: text.buttons.cancel,
        disabled: isQuitting,
      }}
      isOpen
      aria-label={'unsaved changes popup'}
    >
      {text.unsavedChangesPopup.message}
    </NotificationPopup>
  );
}
