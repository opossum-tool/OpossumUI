// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement } from 'react';

import { ButtonText } from '../../enums/enums';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

interface ConfirmationPopupProps {
  onConfirmation(): void;
  content: string;
  header: string;
}

export function ConfirmationPopup(props: ConfirmationPopupProps): ReactElement {
  const dispatch = useAppDispatch();

  function handleDeletionClick(): void {
    props.onConfirmation();
    dispatch(closePopup());
  }

  function handleCancelClick(): void {
    dispatch(closePopup());
  }

  return (
    <NotificationPopup
      content={props.content}
      header={props.header}
      leftButtonConfig={{
        onClick: handleDeletionClick,
        buttonText: ButtonText.Confirm,
        isDark: true,
      }}
      rightButtonConfig={{
        onClick: handleCancelClick,
        buttonText: ButtonText.Cancel,
      }}
      isOpen={true}
      aria-label={'confirmation popup'}
    />
  );
}
