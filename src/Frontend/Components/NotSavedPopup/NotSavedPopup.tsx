// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { text } from '../../../shared/text';
import {
  closePopupAndUnsetTargets,
  proceedFromUnsavedPopup,
} from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch } from '../../state/hooks';
import { useGlobalPopupId } from '../GlobalPopup/popup-close-context';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export function NotSavedPopup() {
  const dispatch = useAppDispatch();
  const popupId = useGlobalPopupId();

  return (
    <NotificationPopup
      header={text.unsavedChangesPopup.title}
      leftButtonConfig={{
        onClick: () => dispatch(proceedFromUnsavedPopup(popupId)),
        buttonText: text.unsavedChangesPopup.discard,
        color: 'secondary',
      }}
      rightButtonConfig={{
        onClick: () => dispatch(closePopupAndUnsetTargets(popupId)),
        buttonText: text.buttons.cancel,
      }}
      isOpen
      aria-label={'unsaved changes popup'}
    >
      {text.unsavedChangesPopup.message}
    </NotificationPopup>
  );
}
