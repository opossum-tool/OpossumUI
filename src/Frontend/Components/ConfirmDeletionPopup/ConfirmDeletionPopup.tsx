// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getPopupAttributionId,
  getSelectedView,
} from '../../state/selectors/view-selector';
import { ConfirmationPopup } from '../ConfirmationPopup/ConfirmationPopup';
import {
  getAttributionIdOfDisplayedPackageInManualPanel,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import {
  deleteAttributionAndSave,
  deleteAttributionGloballyAndSave,
} from '../../state/actions/resource-actions/save-actions';
import { View } from '../../enums/enums';
import { getSelectedAttributionIdInAttributionView } from '../../state/selectors/attribution-view-resource-selectors';

export function ConfirmDeletionPopup(): ReactElement {
  const view = useAppSelector(getSelectedView);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const targetAttributionId = useAppSelector(getPopupAttributionId);
  const selectedAttributionIdAttributionView = useAppSelector(
    getSelectedAttributionIdInAttributionView
  );
  const selectedAttributionIdAuditView =
    useAppSelector(getAttributionIdOfDisplayedPackageInManualPanel) ??
    undefined;

  const dispatch = useAppDispatch();

  function deleteAttributionForResource(): void {
    if (view === View.Audit) {
      targetAttributionId &&
        dispatch(
          deleteAttributionAndSave(
            selectedResourceId,
            targetAttributionId,
            selectedAttributionIdAuditView
          )
        );
    } else {
      targetAttributionId &&
        dispatch(
          deleteAttributionGloballyAndSave(
            targetAttributionId,
            selectedAttributionIdAttributionView
          )
        );
    }
  }

  return (
    <ConfirmationPopup
      onConfirmation={deleteAttributionForResource}
      content={
        'Do you really want to delete this attribution for the current file?'
      }
      header={'Confirm Deletion'}
    />
  );
}
