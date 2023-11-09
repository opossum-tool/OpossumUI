// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement } from 'react';

import { text } from '../../../shared/text';
import { ButtonText } from '../../enums/enums';
import {
  closePopupAndUnsetTargets,
  saveTemporaryDisplayPackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled,
} from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch } from '../../state/hooks';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export function PreferGloballyPopup(): ReactElement {
  const dispatch = useAppDispatch();

  function handleOkClick(): void {
    dispatch(
      saveTemporaryDisplayPackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled(),
    );
  }

  function handleCancelClick(): void {
    dispatch(closePopupAndUnsetTargets());
  }

  return (
    <NotificationPopup
      content={text.preferGloballyPopup.content}
      header={'Warning'}
      centerRightButtonConfig={{
        onClick: handleOkClick,
        buttonText: ButtonText.Ok,
      }}
      rightButtonConfig={{
        onClick: handleCancelClick,
        buttonText: ButtonText.Cancel,
      }}
      isOpen={true}
    />
  );
}
