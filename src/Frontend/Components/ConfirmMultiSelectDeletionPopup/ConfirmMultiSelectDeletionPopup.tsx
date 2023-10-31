// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement } from 'react';

import { deleteAttributionGloballyAndSave } from '../../state/actions/resource-actions/save-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getCurrentAttributionId } from '../../state/selectors/all-views-resource-selectors';
import { getMultiSelectSelectedAttributionIds } from '../../state/selectors/attribution-view-resource-selectors';
import { ConfirmationPopup } from '../ConfirmationPopup/ConfirmationPopup';

export function ConfirmMultiSelectDeletionPopup(): ReactElement {
  const multiSelectSelectedAttributionIds = useAppSelector(
    getMultiSelectSelectedAttributionIds,
  );

  const dispatch = useAppDispatch();

  const selectedAttributionId =
    useAppSelector(getCurrentAttributionId) ?? undefined;

  function deleteMultiSelectSelectedAttributionIds(): void {
    multiSelectSelectedAttributionIds.forEach((attributionId) => {
      dispatch(
        deleteAttributionGloballyAndSave(attributionId, selectedAttributionId),
      );
    });
  }

  return (
    <ConfirmationPopup
      onConfirmation={deleteMultiSelectSelectedAttributionIds}
      content={
        'Do you really want to delete the selected attributions for all files? ' +
        `This action will delete ${multiSelectSelectedAttributionIds.length} attributions.`
      }
      header={'Confirm Deletion'}
    />
  );
}
