// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement, useCallback } from 'react';

import { ButtonText, CheckboxLabel, PopupType } from '../../enums/enums';
import { closeEditAttributionPopupOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import {
  savePackageInfo,
  savePackageInfoIfSavingIsNotDisabled,
} from '../../state/actions/resource-actions/save-actions';
import {
  closePopup,
  openPopup,
} from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getIsSavingDisabled,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/all-views-resource-selectors';
import { getPopupAttributionId } from '../../state/selectors/view-selector';
import { convertDisplayPackageInfoToPackageInfo } from '../../util/convert-package-info';
import { getNeedsReviewChangeHandler } from '../AttributionColumn/attribution-column-helpers';
import { AttributionColumn } from '../AttributionColumn/AttributionColumn';
import { Checkbox } from '../Checkbox/Checkbox';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export function EditAttributionPopup(): ReactElement {
  const dispatch = useAppDispatch();
  const popupAttributionId = useAppSelector(getPopupAttributionId);
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );

  const saveFileRequestListener = useCallback(() => {
    if (temporaryDisplayPackageInfo.wasPreferred && popupAttributionId) {
      dispatch(
        openPopup(
          PopupType.ModifyWasPreferredAttributionPopup,
          popupAttributionId,
        ),
      );
    } else {
      dispatch(
        savePackageInfoIfSavingIsNotDisabled(
          null,
          popupAttributionId,
          convertDisplayPackageInfoToPackageInfo(temporaryDisplayPackageInfo),
        ),
      );
    }
  }, [dispatch, popupAttributionId, temporaryDisplayPackageInfo]);

  const dispatchSavePackageInfoOrOpenWasPreferredPopup = useCallback(() => {
    if (temporaryDisplayPackageInfo.wasPreferred && popupAttributionId) {
      dispatch(
        openPopup(
          PopupType.ModifyWasPreferredAttributionPopup,
          popupAttributionId,
        ),
      );
    } else {
      dispatch(
        savePackageInfo(
          null,
          popupAttributionId,
          convertDisplayPackageInfoToPackageInfo(temporaryDisplayPackageInfo),
        ),
      );
      dispatch(closePopup());
    }
  }, [dispatch, popupAttributionId, temporaryDisplayPackageInfo]);

  function checkForModifiedPackageInfoBeforeClosing(): void {
    popupAttributionId &&
      dispatch(closeEditAttributionPopupOrOpenUnsavedPopup(popupAttributionId));
  }

  const isSavingDisabled = useAppSelector(getIsSavingDisabled);

  return (
    <NotificationPopup
      content={
        <AttributionColumn
          isEditable
          areButtonsHidden
          showManualAttributionData
          saveFileRequestListener={saveFileRequestListener}
          smallerLicenseTextOrCommentField
        />
      }
      header={'Edit Attribution'}
      isOpen={true}
      fullWidth={false}
      leftButtonConfig={{
        onClick: dispatchSavePackageInfoOrOpenWasPreferredPopup,
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
      aria-label={'edit attribution popup'}
      customAction={
        <Checkbox
          label={CheckboxLabel.NeedsReview}
          checked={!!temporaryDisplayPackageInfo.needsReview}
          onChange={getNeedsReviewChangeHandler(
            temporaryDisplayPackageInfo,
            dispatch,
          )}
        />
      }
    />
  );
}
