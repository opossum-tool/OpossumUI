// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useCallback } from 'react';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { ButtonText } from '../../enums/enums';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { AttributionColumn } from '../AttributionColumn/AttributionColumn';
import {
  getIsSavingDisabled,
  getTemporaryPackageInfo,
} from '../../state/selectors/all-views-resource-selectors';
import { setTemporaryPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { DisplayPackageInfo } from '../../../shared/shared-types';
import {
  savePackageInfo,
  savePackageInfoIfSavingIsNotDisabled,
} from '../../state/actions/resource-actions/save-actions';
import { getPopupAttributionId } from '../../state/selectors/view-selector';
import { closeEditAttributionPopupOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { setUpdateTemporaryPackageInfoForCreator } from '../../util/set-update-temporary-package-info-for-creator';
import { convertDisplayPackageInfoToPackageInfo } from '../../util/convert-package-info';

export function EditAttributionPopup(): ReactElement {
  const dispatch = useAppDispatch();
  const popupAttributionId = useAppSelector(getPopupAttributionId);
  const temporaryPackageInfo = useAppSelector(getTemporaryPackageInfo);
  const setUpdateTemporaryPackageInfoFor =
    setUpdateTemporaryPackageInfoForCreator(dispatch, temporaryPackageInfo);

  const saveFileRequestListener = useCallback(() => {
    dispatch(
      savePackageInfoIfSavingIsNotDisabled(
        null,
        popupAttributionId,
        temporaryPackageInfo
      )
    );
  }, [dispatch, popupAttributionId, temporaryPackageInfo]);

  const dispatchSavePackageInfo = useCallback(() => {
    dispatch(
      savePackageInfo(
        null,
        popupAttributionId,
        convertDisplayPackageInfoToPackageInfo(temporaryPackageInfo)
      )
    );
  }, [dispatch, popupAttributionId, temporaryPackageInfo]);

  function checkForModifiedPackageInfoBeforeClosing(): void {
    popupAttributionId &&
      dispatch(closeEditAttributionPopupOrOpenUnsavedPopup(popupAttributionId));
  }
  function savePackageInfoBeforeClosing(): void {
    dispatchSavePackageInfo();
    dispatch(closePopup());
  }
  const isSavingDisabled = useAppSelector(getIsSavingDisabled);

  return (
    <NotificationPopup
      content={
        <AttributionColumn
          isEditable
          areButtonsHidden
          showManualAttributionData
          setUpdateTemporaryPackageInfoFor={setUpdateTemporaryPackageInfoFor}
          setTemporaryPackageInfo={(
            displayPackageInfo: DisplayPackageInfo
          ): void => {
            dispatch(setTemporaryPackageInfo(displayPackageInfo));
          }}
          saveFileRequestListener={saveFileRequestListener}
          smallerLicenseTextOrCommentField
          addMarginForNeedsReviewCheckbox
        />
      }
      header={'Edit Attribution'}
      isOpen={true}
      fullWidth={false}
      leftButtonConfig={{
        onClick: savePackageInfoBeforeClosing,
        buttonText: ButtonText.Save,
        disabled: isSavingDisabled,
        isDark: true,
      }}
      rightButtonConfig={{
        onClick: checkForModifiedPackageInfoBeforeClosing,
        buttonText: ButtonText.Cancel,
      }}
      onBackdropClick={checkForModifiedPackageInfoBeforeClosing}
      onEscapeKeyDown={checkForModifiedPackageInfoBeforeClosing}
    />
  );
}
