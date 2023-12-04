// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement } from 'react';

import { ButtonText, View } from '../../enums/enums';
import {
  checkIfWasPreferredAndShowWarningOrSave,
  checkIfWasPreferredAndShowWarningOrUnlinkAndSave,
  closePopupAndUnsetTargets,
  navigateToTargetResourceOrAttribution,
} from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getCurrentAttributionId,
  getIsGlobalSavingDisabled,
  getIsSavingDisabled,
  getManualAttributionsToResources,
} from '../../state/selectors/all-views-resource-selectors';
import { getSelectedView } from '../../state/selectors/view-selector';
import { hasAttributionMultipleResources } from '../../util/has-attribution-multiple-resources';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export function NotSavedPopup(): ReactElement {
  const dispatch = useAppDispatch();
  const currentAttributionId = useAppSelector(getCurrentAttributionId);
  const attributionsToResources = useAppSelector(
    getManualAttributionsToResources,
  );
  const view = useAppSelector(getSelectedView);
  const isSavingDisabled = useAppSelector(getIsSavingDisabled);
  const isGlobalSavingDisabled = useAppSelector(getIsGlobalSavingDisabled);
  const showSaveGloballyButton =
    view === View.Audit &&
    hasAttributionMultipleResources(
      currentAttributionId,
      attributionsToResources,
    );

  function handleSaveClick(): void {
    dispatch(checkIfWasPreferredAndShowWarningOrUnlinkAndSave());
  }

  function handleSaveGloballyClick(): void {
    dispatch(checkIfWasPreferredAndShowWarningOrSave());
  }

  function handleDiscardClick(): void {
    dispatch(navigateToTargetResourceOrAttribution());
  }

  function handleCancelClick(): void {
    dispatch(closePopupAndUnsetTargets());
  }

  const content = `There are unsaved changes. ${
    isSavingDisabled ? 'Unable to save.' : ''
  }`;

  return (
    <NotificationPopup
      content={content}
      header={'Warning'}
      leftButtonConfig={{
        onClick: showSaveGloballyButton
          ? handleSaveClick
          : handleSaveGloballyClick,
        buttonText: ButtonText.Save,
        disabled: isSavingDisabled,
      }}
      centerLeftButtonConfig={
        showSaveGloballyButton
          ? {
              onClick: handleSaveGloballyClick,
              buttonText: ButtonText.SaveGlobally,
              disabled: isGlobalSavingDisabled,
              color: 'secondary',
            }
          : undefined
      }
      centerRightButtonConfig={{
        onClick: handleDiscardClick,
        buttonText: ButtonText.Discard,
        color: 'secondary',
      }}
      rightButtonConfig={{
        onClick: handleCancelClick,
        buttonText: ButtonText.Cancel,
        color: 'secondary',
      }}
      isOpen={true}
      aria-label={'not saved popup'}
    />
  );
}
