// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import DeleteIcon from '@mui/icons-material/Delete';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useIsMutating } from '@tanstack/react-query';
import { useMemo } from 'react';

import { text } from '../../../../../shared/text';
import { backend } from '../../../../util/backendClient';
import type { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const DeleteButton: React.FC<PackagesPanelChildrenProps> = ({
  pickerMode,
  selectedAttributionIds,
  selection,
  selectionSummary,
  selectionSummaryLoading,
  clearSelection,
}) => {
  const resolveAttributions = backend.resolveAttributions.useMutation();
  const mutationsPending = useIsMutating() > 0;
  const selectedCount =
    selection.mode === 'allMatching'
      ? (selectionSummary?.selectedCount ?? 0)
      : selectedAttributionIds.length;
  const { data: resolvedExternalAttributionIds } =
    backend.resolvedAttributionUuids.useQuery();
  const someSelectedAttributionsAreVisible = useMemo(
    () =>
      selection.mode === 'allMatching'
        ? selectedCount - (selectionSummary?.resolvedCount ?? 0) > 0
        : !!selectedCount &&
          selectedAttributionIds.some(
            (id) => !resolvedExternalAttributionIds?.has(id),
          ),
    [
      resolvedExternalAttributionIds,
      selectedAttributionIds,
      selectedCount,
      selection,
      selectionSummary,
    ],
  );

  return (
    <MuiIconButton
      aria-label={text.packageLists.delete}
      disabled={
        !someSelectedAttributionsAreVisible ||
        selectionSummaryLoading ||
        pickerMode.isActive ||
        mutationsPending
      }
      size={'small'}
      onClick={async () => {
        await resolveAttributions.mutateAsync(
          selection.mode === 'allMatching'
            ? { selection }
            : { attributionUuids: selectedAttributionIds },
        );
        clearSelection();
      }}
      loading={resolveAttributions.isPending}
    >
      <MuiTooltip
        title={text.packageLists.delete}
        disableInteractive
        placement={'top'}
      >
        <DeleteIcon />
      </MuiTooltip>
    </MuiIconButton>
  );
};
