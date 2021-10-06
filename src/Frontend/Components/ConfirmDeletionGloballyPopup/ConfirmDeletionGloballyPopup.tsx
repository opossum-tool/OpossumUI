// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ConfirmationPopup } from '../ConfirmationPopup/ConfirmationPopup';
import { deleteAttributionGloballyAndSave } from '../../state/actions/resource-actions/save-actions';
import { getAttributionIdOfDisplayedPackageInManualPanel } from '../../state/selectors/audit-view-resource-selectors';

export function ConfirmDeletionGloballyPopup(): ReactElement {
  const attributionIdOfSelectedPackageInManualPanel: string | null =
    useSelector(getAttributionIdOfDisplayedPackageInManualPanel);

  const dispatch = useDispatch();

  function deleteAttributionGlobally(): void {
    if (attributionIdOfSelectedPackageInManualPanel) {
      dispatch(
        deleteAttributionGloballyAndSave(
          attributionIdOfSelectedPackageInManualPanel
        )
      );
    }
  }

  return (
    <ConfirmationPopup
      onConfirmation={deleteAttributionGlobally}
      content={'Do you really want to delete this attribution for all files?'}
      header={'Confirm Deletion'}
    />
  );
}
