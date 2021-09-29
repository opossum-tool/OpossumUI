// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSelectedView } from '../../state/selectors/view-selector';
import { ConfirmationPopup } from '../ConfirmationPopup/ConfirmationPopup';
import {
  getAttributionIdOfDisplayedPackageInManualPanel,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import {
  deleteAttributionAndSave,
  deleteAttributionForAllAndSave,
} from '../../state/actions/resource-actions/save-actions';
import { getSelectedAttributionId } from '../../state/selectors/attribution-view-resource-selectors';
import { View } from '../../enums/enums';

export function ConfirmDeletionPopup(): ReactElement {
  const view = useSelector(getSelectedView);
  const selectedResourceId = useSelector(getSelectedResourceId);
  const selectedAttributionId = useSelector(getSelectedAttributionId);
  const attributionIdOfSelectedPackageInManualPanel: string | null =
    useSelector(getAttributionIdOfDisplayedPackageInManualPanel);

  const dispatch = useDispatch();

  function deleteAttributionForResource(): void {
    if (view == View.Audit && attributionIdOfSelectedPackageInManualPanel) {
      dispatch(
        deleteAttributionAndSave(
          selectedResourceId,
          attributionIdOfSelectedPackageInManualPanel
        )
      );
    } else {
      dispatch(deleteAttributionForAllAndSave(selectedAttributionId));
    }
  }

  return (
    <ConfirmationPopup
      onConfirmation={deleteAttributionForResource}
      content={'Do you really want to delete this attribution?'}
      header={'Confirm Deletion'}
    />
  );
}
