// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDialogContentText from '@mui/material/DialogContentText';
import { ReactElement } from 'react';

import { ButtonText, View } from '../../enums/enums';
import {
  closePopupAndUnsetTargets,
  removeWasPreferred,
  saveTemporaryDisplayPackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled,
  unlinkAttributionAndSavePackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled,
} from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getCurrentAttributionId,
  getIsGlobalSavingDisabled,
  getManualAttributionsToResources,
} from '../../state/selectors/all-views-resource-selectors';
import { getSelectedView } from '../../state/selectors/view-selector';
import { hasAttributionMultipleResources } from '../../util/has-attribution-multiple-resources';
import { WasPreferredIcon } from '../Icons/Icons';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export function ModifyWasPreferredAttributionPopup(): ReactElement {
  const dispatch = useAppDispatch();
  const currentAttributionId = useAppSelector(getCurrentAttributionId);
  const attributionsToResources = useAppSelector(
    getManualAttributionsToResources,
  );
  const view = useAppSelector(getSelectedView);
  const isGlobalSavingDisabled = useAppSelector(getIsGlobalSavingDisabled);
  const showSaveGloballyButton =
    view === View.Audit &&
    hasAttributionMultipleResources(
      currentAttributionId,
      attributionsToResources,
    );

  function handleSaveClick(): void {
    dispatch(removeWasPreferred());
    dispatch(
      unlinkAttributionAndSavePackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled(),
    );
  }

  function handleSaveGloballyClick(): void {
    dispatch(removeWasPreferred());
    dispatch(
      saveTemporaryDisplayPackageInfoAndNavigateToTargetViewIfSavingIsNotDisabled(),
    );
  }

  function handleCancelClick(): void {
    dispatch(closePopupAndUnsetTargets());
  }

  const content = (
    <MuiDialogContentText style={{ display: 'flex', alignItems: 'center' }}>
      You are about to modify an attribution that was preferred in the past. Are
      you sure you want to continue? The attribution will no longer be marked
      with a <WasPreferredIcon />.
    </MuiDialogContentText>
  );

  return (
    <NotificationPopup
      content={content}
      header={'Warning'}
      centerLeftButtonConfig={{
        onClick: showSaveGloballyButton
          ? handleSaveClick
          : handleSaveGloballyClick,
        buttonText: ButtonText.Save,
        isDark: true,
      }}
      centerRightButtonConfig={
        showSaveGloballyButton
          ? {
              onClick: handleSaveGloballyClick,
              buttonText: ButtonText.SaveGlobally,
              disabled: isGlobalSavingDisabled,
            }
          : undefined
      }
      rightButtonConfig={{
        onClick: handleCancelClick,
        buttonText: ButtonText.Cancel,
      }}
      isOpen={true}
    />
  );
}
