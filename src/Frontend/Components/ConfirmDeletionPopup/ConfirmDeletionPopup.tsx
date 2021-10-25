// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getSelectedView } from '../../state/selectors/view-selector';
import { ConfirmationPopup } from '../ConfirmationPopup/ConfirmationPopup';
import {
  getAttributionIdOfDisplayedPackageInManualPanel,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import {
  deleteAttributionAndSave,
  deleteAttributionGloballyAndSave,
} from '../../state/actions/resource-actions/save-actions';
import { getSelectedAttributionId } from '../../state/selectors/attribution-view-resource-selectors';
import { View } from '../../enums/enums';

export function ConfirmDeletionPopup(): ReactElement {
  const view = useAppSelector(getSelectedView);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const attributionIdOfSelectedPackageInManualPanel: string | null =
    useAppSelector(getAttributionIdOfDisplayedPackageInManualPanel);

  const dispatch = useAppDispatch();

  function deleteAttributionForResource(): void {
    if (view === View.Audit) {
      if (attributionIdOfSelectedPackageInManualPanel) {
        dispatch(
          deleteAttributionAndSave(
            selectedResourceId,
            attributionIdOfSelectedPackageInManualPanel
          )
        );
      }
    } else {
      dispatch(deleteAttributionGloballyAndSave(selectedAttributionId));
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
