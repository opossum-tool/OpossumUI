// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement } from 'react';

import { ButtonText } from '../../enums/enums';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export function ChangedInputFilePopup(): ReactElement {
  const dispatch = useAppDispatch();

  function handleKeepClick(): void {
    window.electronAPI.keepFile();
    dispatch(closePopup());
  }

  function handleOverwriteClick(): void {
    window.electronAPI.deleteFile();
    dispatch(closePopup());
  }

  const content =
    'The input file has changed. Do you want ' +
    'to keep the old attribution file or delete it?';

  return (
    <NotificationPopup
      content={content}
      header={'Warning'}
      leftButtonConfig={{
        onClick: handleKeepClick,
        buttonText: ButtonText.Keep,
        isDark: true,
      }}
      centerRightButtonConfig={{
        onClick: handleOverwriteClick,
        buttonText: ButtonText.Delete,
      }}
      isOpen={true}
    />
  );
}
