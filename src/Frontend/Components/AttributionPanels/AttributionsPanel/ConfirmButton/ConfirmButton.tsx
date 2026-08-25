// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CheckIcon from '@mui/icons-material/Check';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useIsMutating } from '@tanstack/react-query';
import { useState } from 'react';

import type { AttributionSelection } from '../../../../../shared/attribution-selection';
import { text } from '../../../../../shared/text';
import { ConfirmSavePopup } from '../../../ConfirmSavePopup/ConfirmSavePopup';
import type { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const ConfirmButton: React.FC<PackagesPanelChildrenProps> = ({
  attributions,
  pickerMode,
  selectedAttributionIds,
  selection,
  selectionSummary,
  selectionSummaryLoading = false,
  clearSelection,
}) => {
  const [isConfirmSavePopupOpen, setIsConfirmSavePopupOpen] = useState(false);
  const preSelectedAttributionIds = selectedAttributionIds.filter(
    (id) => attributions?.[id]?.preSelected,
  );
  const preSelectedSelection: AttributionSelection =
    selection?.mode === 'allMatching'
      ? {
          ...selection,
          query: {
            ...selection.query,
            filters: selection.query.filters.includes('preSelected')
              ? selection.query.filters
              : [...selection.query.filters, 'preSelected'],
          },
        }
      : { mode: 'explicit', attributionUuids: preSelectedAttributionIds };
  const mutationsPending = useIsMutating() > 0;

  return (
    <>
      <MuiIconButton
        aria-label={text.packageLists.confirm}
        disabled={
          (selection?.mode === 'allMatching'
            ? !selectionSummary?.preSelectedCount
            : !preSelectedAttributionIds.length) ||
          selectionSummaryLoading ||
          pickerMode.isActive ||
          mutationsPending
        }
        onClick={() => setIsConfirmSavePopupOpen(true)}
        size={'small'}
      >
        <MuiTooltip
          title={text.packageLists.confirm}
          disableInteractive
          placement={'top'}
        >
          <CheckIcon />
        </MuiTooltip>
      </MuiIconButton>
      <ConfirmSavePopup
        attributionIdsToSave={preSelectedAttributionIds}
        selection={preSelectedSelection}
        open={isConfirmSavePopupOpen}
        onClose={() => setIsConfirmSavePopupOpen(false)}
        clearSelection={clearSelection}
      />
    </>
  );
};
