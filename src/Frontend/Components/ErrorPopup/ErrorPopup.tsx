// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';

export const TIME_POPUP_IS_DISPLAYED = 1500;

export function ErrorPopup(): ReactElement {
  const dispatch = useAppDispatch();

  function close(): void {
    dispatch(closePopup());
  }

  setTimeout(() => close(), TIME_POPUP_IS_DISPLAYED);

  return (
    <NotificationPopup
      content={'Unable to save.'}
      header={'Error'}
      onBackdropClick={close}
      isOpen={true}
      onEscapeKeyDown={close}
    />
  );
}
