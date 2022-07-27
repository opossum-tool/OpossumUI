// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { useAppDispatch } from '../../state/hooks';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { ButtonText } from '../../enums/enums';
import { saveManualAndResolvedAttributionsToFile } from '../../state/actions/resource-actions/save-actions';

export function ChangedInputFilePopup(): ReactElement {
  const dispatch = useAppDispatch();

  function handleUpdateClick(): void {
    dispatch(saveManualAndResolvedAttributionsToFile());
    dispatch(closePopup());
  }

  function handleOverwriteClick(): void {
    window.electronAPI.overwriteFile();
    dispatch(closePopup());
  }

  const content =
    'The input file has changed. Do you want to update the output file and continue to use it or completely overwrite it?';

  return (
    <NotificationPopup
      content={content}
      header={'Warning'}
      leftButtonConfig={{
        onClick: handleUpdateClick,
        buttonText: ButtonText.Update,
      }}
      centerRightButtonConfig={{
        onClick: handleOverwriteClick,
        buttonText: ButtonText.Overwrite,
      }}
      isOpen={true}
    />
  );
}
