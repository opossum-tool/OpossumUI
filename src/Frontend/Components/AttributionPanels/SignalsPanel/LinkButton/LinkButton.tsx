// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CallMergeIcon from '@mui/icons-material/CallMerge';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { skipToken, useIsMutating } from '@tanstack/react-query';

import { text } from '../../../../../shared/text';
import { setTargetAttributionRelation } from '../../../../state/actions/resource-actions/audit-view-simple-actions';
import { useAppDispatch, useAppSelector } from '../../../../state/hooks';
import {
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
  attributions,
  pickerMode,
  selectedAttributionIds,
  selection,
  clearBulkSelection,
  selectionSummary,
  selectionSummaryLoading,
}) => {
  const dispatch = useAppDispatch();

  const isSelectedResourceBreakpoint = useIsSelectedResourceBreakpoint();
  const isSelectedResourceReadonly = useIsSelectedResourceReadonly();
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);

  const handleFocusedAttributionOutcome =
    useFocusedAttributionOutcomeBeforeInvalidation();
  const createOrMatch = backend.createOrMatchAttributions.useMutation({
    scope: { id: 'signalsPanel' },
    onBeforeInvalidation: handleFocusedAttributionOutcome,
  });
  const mutationsPending = useIsMutating() > 0;
  const selectedCount =
    selection.mode === 'allMatching'
      ? (selectionSummary?.selectedCount ?? 0)
      : selectedAttributionIds.length;
  const singleSelectedAttributionId =
    selection.mode === 'explicit' && selectedAttributionIds.length === 1
      ? selectedAttributionIds[0]
      : undefined;
  const linkStatusQuery = backend.getAttributionLinkStatus.useQuery(
    singleSelectedAttributionId
      ? {
          resourcePath: selectedResourceId,
          attributionUuid: singleSelectedAttributionId,
        }
      : skipToken,
  );

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
    clearBulkSelection();
  };

  return (
    <MuiIconButton
      aria-label={text.packageLists.linkAsAttribution}
      disabled={
        isSelectedResourceBreakpoint ||
        isSelectedResourceReadonly ||
        !selectedCount ||
        selectionSummaryLoading ||
        pickerMode.isActive ||
        mutationsPending ||
        (linkStatusQuery.isSuccess &&
          (linkStatusQuery.data.matchingManualOnResource ||
            linkStatusQuery.data.linkWouldBeRedundant))
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
