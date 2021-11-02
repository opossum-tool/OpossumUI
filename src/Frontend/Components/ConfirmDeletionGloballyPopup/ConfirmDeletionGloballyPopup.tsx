// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { ConfirmationPopup } from '../ConfirmationPopup/ConfirmationPopup';
import { deleteAttributionGloballyAndSave } from '../../state/actions/resource-actions/save-actions';
import { getTargetAttributionId } from '../../state/selectors/view-selector';

export function ConfirmDeletionGloballyPopup(): ReactElement {
  const targetAttributionId: string = useAppSelector(getTargetAttributionId);

  const dispatch = useAppDispatch();

  function deleteAttributionGlobally(): void {
    dispatch(deleteAttributionGloballyAndSave(targetAttributionId));
  }

  return (
    <ConfirmationPopup
      onConfirmation={deleteAttributionGlobally}
      content={'Do you really want to delete this attribution for all files?'}
      header={'Confirm Deletion'}
    />
  );
}
