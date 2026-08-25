// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import DeleteIcon from '@mui/icons-material/Delete';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useIsMutating } from '@tanstack/react-query';
import { useState } from 'react';

import { text } from '../../../../../shared/text';
import { ConfirmDeletePopup } from '../../../ConfirmDeletePopup/ConfirmDeletePopup';
import type { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const DeleteButton: React.FC<PackagesPanelChildrenProps> = ({
  pickerMode,
  selectedAttributionIds,
  selection,
  selectionSummary,
  selectionSummaryLoading = false,
  clearSelection,
}) => {
  const [isConfirmDeletionPopupOpen, setIsConfirmDeletionPopupOpen] =
    useState(false);

  const mutationsPending = useIsMutating() > 0;
  const selectedCount =
    selection?.mode === 'allMatching'
      ? (selectionSummary?.selectedCount ?? 0)
      : selectedAttributionIds.length;

  return (
    <>
      <MuiIconButton
        aria-label={text.packageLists.delete}
        disabled={
          !selectedCount ||
          selectionSummaryLoading ||
          pickerMode.isActive ||
          mutationsPending
        }
        onClick={() => setIsConfirmDeletionPopupOpen(true)}
        size={'small'}
      >
        <MuiTooltip
          title={text.packageLists.delete}
          disableInteractive
          placement={'top'}
        >
          <DeleteIcon />
        </MuiTooltip>
      </MuiIconButton>
      <ConfirmDeletePopup
        open={isConfirmDeletionPopupOpen}
        onClose={() => setIsConfirmDeletionPopupOpen(false)}
        attributionIdsToDelete={selectedAttributionIds}
        selection={selection}
        clearSelection={clearSelection}
      />
    </>
  );
};
