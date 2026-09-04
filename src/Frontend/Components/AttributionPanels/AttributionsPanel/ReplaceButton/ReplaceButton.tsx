// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useIsMutating } from '@tanstack/react-query';

import { text } from '../../../../../shared/text';
import { useAttributionSelectionForReplacement } from '../../../../state/variables/use-attribution-selection-for-replacement';
import type { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const ReplaceButton: React.FC<PackagesPanelChildrenProps> = ({
  attributionIds,
  selectedAttributionIds,
  pickerMode,
  selection,
  selectionSummary,
  selectionSummaryLoading,
  clearSelection,
}) => {
  const [selectionForReplacement, setSelectionForReplacement] =
    useAttributionSelectionForReplacement();
  const label = selectionForReplacement
    ? text.packageLists.cancelReplace
    : text.packageLists.replace;

  const mutationsPending = useIsMutating() > 0;
  const isQueryWide = selection.mode === 'allMatching';
  const selectedCount = isQueryWide
    ? (selectionSummary?.selectedCount ?? 0)
    : selectedAttributionIds.length;

  return (
    <MuiIconButton
      aria-label={label}
      disabled={
        !attributionIds ||
        !selectedCount ||
        selectionSummaryLoading ||
        (!isQueryWide &&
          (!(attributionIds.length - selectedAttributionIds.length) ||
            attributionIds.length < 2)) ||
        mutationsPending ||
        pickerMode.mode === 'compare'
      }
      size={'small'}
      onClick={() => {
        if (selectionForReplacement) {
          setSelectionForReplacement(null);
          clearSelection();
          return;
        }

        setSelectionForReplacement(selection);
      }}
      color={selectionForReplacement ? 'success' : undefined}
    >
      <MuiTooltip title={label} disableInteractive placement={'top'}>
        <ChangeCircleIcon />
      </MuiTooltip>
    </MuiIconButton>
  );
};
