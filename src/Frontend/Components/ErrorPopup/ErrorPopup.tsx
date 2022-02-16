// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';

export const TIME_POPUP_IS_DISPLAYED = 1500;

interface ErrorPopupProps {
  content: ReactElement | string;
}

export function ErrorPopup(props: ErrorPopupProps): ReactElement {
  const dispatch = useAppDispatch();

  function close(): void {
    dispatch(closePopup());
  }

  setTimeout(() => close(), TIME_POPUP_IS_DISPLAYED);

  return (
    <NotificationPopup
      content={props.content}
      header={'Error'}
      onBackdropClick={close}
      isOpen={true}
      onEscapeKeyDown={close}
    />
  );
}
