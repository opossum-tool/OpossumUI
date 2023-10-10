// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { ConfirmationPopup } from '../ConfirmationPopup/ConfirmationPopup';
import { deleteAttributionGloballyAndSave } from '../../state/actions/resource-actions/save-actions';
import { getPopupAttributionId } from '../../state/selectors/view-selector';
import { getCurrentAttributionId } from '../../state/selectors/all-views-resource-selectors';

export function ConfirmDeletionGloballyPopup(): ReactElement {
  const targetAttributionId = useAppSelector(getPopupAttributionId);
  const selectedAttributionId =
    useAppSelector(getCurrentAttributionId) ?? undefined;

  const dispatch = useAppDispatch();

  function deleteAttributionGlobally(): void {
    targetAttributionId &&
      dispatch(
        deleteAttributionGloballyAndSave(
          targetAttributionId,
          selectedAttributionId,
        ),
      );
  }

  return (
    <ConfirmationPopup
      onConfirmation={deleteAttributionGlobally}
      content={'Do you really want to delete this attribution for all files?'}
      header={'Confirm Deletion'}
    />
  );
}
