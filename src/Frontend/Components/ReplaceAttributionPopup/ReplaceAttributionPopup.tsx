// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { useDispatch } from 'react-redux';
import { ButtonTitle } from '../../enums/enums';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { closePopup } from '../../state/actions/view-actions/view-actions';

export function ReplaceAttributionPopup(): ReactElement {
  const dispatch = useDispatch();

  function handleCancelClick(): void {
    dispatch(closePopup());
  }

  return (
    <NotificationPopup
      content={'This removes the following attribution'}
      header={'Warning'}
      rightButtonTitle={ButtonTitle.Cancel}
      onRightButtonClick={handleCancelClick}
      isOpen={true}
    />
  );
}
