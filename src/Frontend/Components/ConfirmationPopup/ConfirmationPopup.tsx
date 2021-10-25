// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { ButtonText } from '../../enums/enums';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';

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
      leftButtonText={ButtonText.Confirm}
      onLeftButtonClick={handleDeletionClick}
      rightButtonText={ButtonText.Cancel}
      onRightButtonClick={handleCancelClick}
      isOpen={true}
    />
  );
}
