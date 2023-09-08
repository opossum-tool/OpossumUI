// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { ButtonText } from '../../enums/enums';
import { useAppDispatch } from '../../state/hooks';

export function LocatorPopup(): ReactElement {
  const dispatch = useAppDispatch();
  function close(): void {
    dispatch(closePopup());
  }

  const content = <></>;

  return (
    <NotificationPopup
      content={content}
      header={'Locate Signals'}
      isOpen={true}
      fullWidth={true}
      leftButtonConfig={{
        onClick: (): void => {},
        buttonText: ButtonText.Clear,
      }}
      centerLeftButtonConfig={{
        onClick: (): void => {},
        buttonText: ButtonText.Apply,
      }}
      rightButtonConfig={{
        onClick: close,
        buttonText: ButtonText.Cancel,
      }}
      onBackdropClick={close}
      onEscapeKeyDown={close}
    />
  );
}
