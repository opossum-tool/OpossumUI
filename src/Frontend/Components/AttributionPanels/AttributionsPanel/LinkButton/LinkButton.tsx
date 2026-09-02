// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CallMergeIcon from '@mui/icons-material/CallMerge';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useIsMutating } from '@tanstack/react-query';

import { text } from '../../../../../shared/text';
import { setTargetAttributionRelation } from '../../../../state/actions/resource-actions/audit-view-simple-actions';
import { useAppDispatch, useAppSelector } from '../../../../state/hooks';
import {
  getIsPackageInfoDirty,
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../../../../state/selectors/resource-selectors';
import { backend } from '../../../../util/backendClient';
import { useFocusedAttributionOutcomeBeforeInvalidation } from '../../../../util/use-focused-attribution-outcome';
import {
  useIsSelectedResourceBreakpoint,
  useIsSelectedResourceReadonly,
} from '../../../../util/use-selected-resource';
import type { PackagesPanelChildrenProps } from '../../PackagesPanel/PackagesPanel';

export const LinkButton: React.FC<PackagesPanelChildrenProps> = ({
  activeRelation,
  attributions,
  pickerMode,
  selectedAttributionIds,
  selection,
  clearSelection,
  selectionSummary,
  selectionSummaryLoading,
}) => {
  const dispatch = useAppDispatch();
  const isPackageInfoModified = useAppSelector(getIsPackageInfoDirty);
  const isSelectedResourceBreakpoint = useIsSelectedResourceBreakpoint();
  const isSelectedResourceReadonly = useIsSelectedResourceReadonly();
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);

  const handleFocusedAttributionOutcome =
    useFocusedAttributionOutcomeBeforeInvalidation();
  const createOrMatch = backend.createOrMatchAttributions.useMutation({
    onBeforeInvalidation: handleFocusedAttributionOutcome,
  });
  const mutationsPending = useIsMutating() > 0;
  const selectedCount =
    selection.mode === 'allMatching'
      ? (selectionSummary?.selectedCount ?? 0)
      : selectedAttributionIds.length;

  const handleLink = async () => {
    if (attributions) {
      const attributionsToLink = Object.fromEntries(
        selectedAttributionIds.map((attributionId) => [
          attributionId,
          attributions[attributionId],
        ]),
      );
      await createOrMatch.mutateAsync(
        selection.mode === 'allMatching'
          ? {
              resourcePath: selectedResourceId,
              selection,
              focusedAttributionUuid: selectedAttributionId,
            }
          : {
              resourcePath: selectedResourceId,
              attributions: attributionsToLink,
              focusedAttributionUuid: selectedAttributionId,
            },
      );
    }
    dispatch(setTargetAttributionRelation('resource'));
    clearSelection();
  };

  return (
    <MuiIconButton
      aria-label={text.packageLists.linkAsAttribution}
      disabled={
        isSelectedResourceBreakpoint ||
        isSelectedResourceReadonly ||
        !selectedCount ||
        selectionSummaryLoading ||
        isPackageInfoModified ||
        activeRelation === 'resource' ||
        pickerMode.isActive ||
        mutationsPending
      }
      loading={createOrMatch.isPending}
      size={'small'}
      onClick={handleLink}
    >
      <MuiTooltip
        title={text.packageLists.linkAsAttribution}
        disableInteractive
        placement={'top'}
      >
        <CallMergeIcon />
      </MuiTooltip>
    </MuiIconButton>
  );
};
