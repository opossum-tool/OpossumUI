// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { useDispatch } from 'react-redux';
import { closePopup } from '../../state/actions/view-actions/view-actions';

export const TIME_POPUP_IS_DISPLAYED = 1500;

export function ErrorPopup(): ReactElement {
  const dispatch = useDispatch();

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
