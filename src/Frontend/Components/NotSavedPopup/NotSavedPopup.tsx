// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { text } from '../../../shared/text';
import {
  closePopupAndUnsetTargets,
  proceedFromUnsavedPopup,
} from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getQuitAppRequested } from '../../state/selectors/view-selector';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export function NotSavedPopup() {
  const dispatch = useAppDispatch();
  const quitAppRequested = useAppSelector(getQuitAppRequested);

  return (
    <NotificationPopup
      header={text.unsavedChangesPopup.title}
      leftButtonConfig={{
        onClick: () => dispatch(proceedFromUnsavedPopup()),
        buttonText: quitAppRequested
          ? text.unsavedChangesPopup.discardAndQuit
          : text.unsavedChangesPopup.discard,
        color: 'secondary',
      }}
      rightButtonConfig={{
        onClick: () => dispatch(closePopupAndUnsetTargets()),
        buttonText: text.buttons.cancel,
      }}
      isOpen
      aria-label={'unsaved changes popup'}
    >
      {text.unsavedChangesPopup.message}
    </NotificationPopup>
  );
}
