// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { ButtonText, PopupType, View } from '../../enums/enums';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import {
  closePopup,
  openPopup,
  setTargetView,
} from '../../state/actions/view-actions/view-actions';
import {
  navigateToTargetResourceOrAttribution,
  saveTemporaryPackageInfoAndNavigateToTargetView,
  unlinkAttributionAndSavePackageInfoAndNavigateToTargetView,
} from '../../state/actions/popup-actions/popup-actions';
import {
  getAttributionIdToSaveTo,
  getIsSavingDisabled,
  getManualAttributionsToResources,
} from '../../state/selectors/all-views-resource-selectors';
import { hasAttributionMultipleResources } from '../../util/has-attribution-multiple-resources';
import { getSelectedView } from '../../state/selectors/view-selector';
import { setTargetSelectedAttributionId } from '../../state/actions/resource-actions/attribution-view-simple-actions';
import { setTargetSelectedResourceId } from '../../state/actions/resource-actions/audit-view-simple-actions';

export function NotSavedPopup(): ReactElement {
  const dispatch = useAppDispatch();
  const currentAttributionId = useAppSelector(getAttributionIdToSaveTo);
  const attributionsToResources = useAppSelector(
    getManualAttributionsToResources
  );
  const view = useAppSelector(getSelectedView);
  const isSavingDisabled = useAppSelector(getIsSavingDisabled);
  const showSaveGloballyButton =
    view === View.Audit &&
    hasAttributionMultipleResources(
      currentAttributionId,
      attributionsToResources
    );

  function handleSaveClick(): void {
    dispatch(unlinkAttributionAndSavePackageInfoAndNavigateToTargetView());
  }

  function handleSaveGloballyClick(): void {
    dispatch(saveTemporaryPackageInfoAndNavigateToTargetView());
  }

  function handleUndoClick(): void {
    dispatch(navigateToTargetResourceOrAttribution());
  }

  function reopenEditAttributionPopupIfItWasPreviouslyOpen(): void {
    if (view === View.Report && currentAttributionId) {
      dispatch(openPopup(PopupType.EditAttributionPopup, currentAttributionId));
    }
  }

  function handleCancelClick(): void {
    dispatch(setTargetView(null));
    dispatch(setTargetSelectedResourceId(''));
    dispatch(setTargetSelectedAttributionId(''));
    dispatch(closePopup());
    reopenEditAttributionPopupIfItWasPreviouslyOpen();
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
        isDisabled: isSavingDisabled,
      }}
      centerLeftButtonConfig={
        showSaveGloballyButton
          ? {
              onClick: handleSaveGloballyClick,
              buttonText: ButtonText.SaveGlobally,
              isDisabled: isSavingDisabled,
            }
          : undefined
      }
      centerRightButtonConfig={{
        onClick: handleUndoClick,
        buttonText: ButtonText.Undo,
      }}
      rightButtonConfig={{
        onClick: handleCancelClick,
        buttonText: ButtonText.Cancel,
      }}
      isOpen={true}
    />
  );
}
