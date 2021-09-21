// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ButtonTitle, View } from '../../enums/enums';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import {
  closePopup,
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
  const dispatch = useDispatch();
  const currentAttributionId = useSelector(getAttributionIdToSaveTo);
  const attributionsToResources = useSelector(getManualAttributionsToResources);
  const view = useSelector(getSelectedView);
  const isSavingDisabled = useSelector(getIsSavingDisabled);
  const showSaveForAllButton =
    view === View.Audit &&
    hasAttributionMultipleResources(
      currentAttributionId,
      attributionsToResources
    );

  function handleSaveClick(): void {
    dispatch(unlinkAttributionAndSavePackageInfoAndNavigateToTargetView());
  }

  function handleSaveForAllClick(): void {
    dispatch(saveTemporaryPackageInfoAndNavigateToTargetView());
  }

  function handleUndoClick(): void {
    dispatch(navigateToTargetResourceOrAttribution());
  }

  function handleCancelClick(): void {
    dispatch(setTargetView(null));
    dispatch(setTargetSelectedResourceId(''));
    dispatch(setTargetSelectedAttributionId(''));
    dispatch(closePopup());
  }

  const content = `There are unsaved changes. ${
    isSavingDisabled ? 'Unable to save.' : ''
  }`;

  return (
    <NotificationPopup
      content={content}
      header={'Warning'}
      leftButtonTitle={ButtonTitle.Save}
      isLeftButtonDisabled={isSavingDisabled}
      onLeftButtonClick={
        showSaveForAllButton ? handleSaveClick : handleSaveForAllClick
      }
      centerLeftButtonTitle={
        showSaveForAllButton ? ButtonTitle.SaveForAll : undefined
      }
      isCenterLeftButtonDisabled={isSavingDisabled}
      onCenterLeftButtonClick={
        showSaveForAllButton ? handleSaveForAllClick : undefined
      }
      centerRightButtonTitle={ButtonTitle.Undo}
      onCenterRightButtonClick={handleUndoClick}
      rightButtonTitle={ButtonTitle.Cancel}
      onRightButtonClick={handleCancelClick}
      isOpen={true}
    />
  );
}
