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
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export function NotSavedPopup() {
  const dispatch = useAppDispatch();

  return (
    <NotificationPopup
      content={text.unsavedChangesPopup.message}
      header={text.unsavedChangesPopup.title}
      leftButtonConfig={{
        onClick: () => dispatch(proceedFromUnsavedPopup()),
        buttonText: text.unsavedChangesPopup.discard,
        color: 'secondary',
      }}
      rightButtonConfig={{
        onClick: () => dispatch(closePopupAndUnsetTargets()),
        buttonText: text.buttons.cancel,
      }}
      isOpen
      aria-label={'unsaved changes popup'}
    />
  );
}
