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
import { setOriginIdsToPreferOverGlobally } from '../../state/actions/resource-actions/preference-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getTemporaryDisplayPackageInfo } from '../../state/selectors/all-views-resource-selectors';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export function ChangePreferredStatusGloballyPopup(): ReactElement {
  const dispatch = useAppDispatch();
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );

  function handleOkClick(): void {
    dispatch(setOriginIdsToPreferOverGlobally(temporaryDisplayPackageInfo));
    dispatch(
      saveTemporaryDisplayPackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled(),
    );
  }

  function handleCancelClick(): void {
    dispatch(closePopupAndUnsetTargets());
  }

  const content = temporaryDisplayPackageInfo.preferred
    ? text.changePreferredStatusGloballyPopup.markAsPreferred
    : text.changePreferredStatusGloballyPopup.unmarkAsPreferred;

  return (
    <NotificationPopup
      content={content}
      header={'Warning'}
      centerRightButtonConfig={{
        onClick: handleOkClick,
        buttonText: ButtonText.Ok,
        isDark: true,
      }}
      rightButtonConfig={{
        onClick: handleCancelClick,
        buttonText: ButtonText.Cancel,
      }}
      isOpen={true}
      aria-label={'change preferred status globally popup'}
    />
  );
}
