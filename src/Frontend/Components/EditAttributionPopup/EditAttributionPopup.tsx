// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement, useCallback } from 'react';

import { ButtonText } from '../../enums/enums';
import { closeEditAttributionPopupOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import {
  savePackageInfo,
  savePackageInfoIfSavingIsNotDisabled,
} from '../../state/actions/resource-actions/save-actions';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getTemporaryDisplayPackageInfo } from '../../state/selectors/all-views-resource-selectors';
import { getPopupAttributionId } from '../../state/selectors/view-selector';
import { convertDisplayPackageInfoToPackageInfo } from '../../util/convert-package-info';
import { AttributionColumn } from '../AttributionColumn/AttributionColumn';
import { ButtonRow } from '../AttributionColumn/ButtonRow';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export function EditAttributionPopup(): ReactElement {
  const dispatch = useAppDispatch();
  const popupAttributionId = useAppSelector(getPopupAttributionId);
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );

  const saveFileRequestListener = useCallback(() => {
    dispatch(
      savePackageInfoIfSavingIsNotDisabled(
        null,
        popupAttributionId,
        convertDisplayPackageInfoToPackageInfo(temporaryDisplayPackageInfo),
      ),
    );
  }, [dispatch, popupAttributionId, temporaryDisplayPackageInfo]);

  const dispatchSavePackageInfoOrOpenWasPreferredPopup = useCallback(() => {
    dispatch(
      savePackageInfo(
        null,
        popupAttributionId,
        convertDisplayPackageInfoToPackageInfo(temporaryDisplayPackageInfo),
      ),
    );
    dispatch(closePopup());
  }, [dispatch, popupAttributionId, temporaryDisplayPackageInfo]);

  function checkForModifiedPackageInfoBeforeClosing(): void {
    popupAttributionId &&
      dispatch(closeEditAttributionPopupOrOpenUnsavedPopup(popupAttributionId));
  }

  return (
    <NotificationPopup
      content={
        <AttributionColumn
          isEditable
          areButtonsHidden
          saveFileRequestListener={saveFileRequestListener}
        />
      }
      background={'lightestBlue'}
      header={'Edit Attribution'}
      isOpen={true}
      fullWidth
      onBackdropClick={checkForModifiedPackageInfoBeforeClosing}
      onEscapeKeyDown={checkForModifiedPackageInfoBeforeClosing}
      aria-label={'edit attribution popup'}
      customAction={
        <ButtonRow
          displayPackageInfo={temporaryDisplayPackageInfo}
          onSaveButtonClick={dispatchSavePackageInfoOrOpenWasPreferredPopup}
          additionalActions={[
            {
              onClick: checkForModifiedPackageInfoBeforeClosing,
              buttonText: ButtonText.Cancel,
              color: 'secondary',
            },
          ]}
        />
      }
    />
  );
}
