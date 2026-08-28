// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useIsMutating } from '@tanstack/react-query';
import { useMemo } from 'react';

import { text } from '../../../../../shared/text';
import { useUserSettings } from '../../../../state/variables/use-user-setting';
import { backend } from '../../../../util/backendClient';
import type { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const RestoreButton: React.FC<PackagesPanelChildrenProps> = ({
  pickerMode,
  selectedAttributionIds,
  selection,
  selectionSummary,
  selectionSummaryLoading,
  clearSelection,
}) => {
  const unresolveAttributions = backend.unresolveAttributions.useMutation({
    scope: { id: 'signalsPanel' },
  });
  const mutationsPending = useIsMutating() > 0;
  const selectedCount =
    selection.mode === 'allMatching'
      ? (selectionSummary?.selectedCount ?? 0)
      : selectedAttributionIds.length;
  const { data: resolvedExternalAttributionIds } =
    backend.resolvedAttributionUuids.useQuery();
  const [userSettings] = useUserSettings();
  const areHiddenSignalsVisible = userSettings.areHiddenSignalsVisible;
  const someSelectedAttributionsAreHidden = useMemo(
    () =>
      selection.mode === 'allMatching'
        ? (selectionSummary?.resolvedCount ?? 0) > 0
        : !!selectedCount &&
          selectedAttributionIds.some((id) =>
            resolvedExternalAttributionIds?.has(id),
          ),
    [
      resolvedExternalAttributionIds,
      selectedAttributionIds,
      selectedCount,
      selection,
      selectionSummary,
    ],
  );

  if (!areHiddenSignalsVisible) {
    return null;
  }

  return (
    <MuiIconButton
      aria-label={text.packageLists.restore}
      disabled={
        !someSelectedAttributionsAreHidden ||
        selectionSummaryLoading ||
        pickerMode.isActive ||
        mutationsPending
      }
      size={'small'}
      onClick={async () => {
        await unresolveAttributions.mutateAsync({ selection });
        clearSelection();
      }}
      loading={unresolveAttributions.isPending}
    >
      <MuiTooltip
        title={text.packageLists.restore}
        disableInteractive
        placement={'top'}
      >
        <RestoreFromTrashIcon />
      </MuiTooltip>
    </MuiIconButton>
  );
};
