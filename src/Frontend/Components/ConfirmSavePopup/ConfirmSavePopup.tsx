// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';

import type { AttributionSelection } from '../../../shared/attribution-selection';
import { text } from '../../../shared/text';
import { applyFocusedAttributionOutcome } from '../../state/actions/resource-actions/navigation-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getSelectedAttributionId,
  getSelectedResourceId,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/resource-selectors';
import { backend } from '../../util/backendClient';
import { maybePluralize } from '../../util/maybe-pluralize';
import { useLinkedAttributionActionData } from '../AttributionAction/useLinkedAttributionActionData';
import { ConfirmAttributionActionPopup } from '../ConfirmAttributionActionPopup/ConfirmAttributionActionPopup';

interface Props {
  attributionIdsToSave: Array<string>;
  open: boolean;
  onClose: () => void;
  selection?: AttributionSelection;
  clearSelection?: () => void;
}

export const ConfirmSavePopup: React.FC<Props> = ({
  attributionIdsToSave,
  open,
  onClose,
  selection,
  clearSelection,
}) => {
  const dispatch = useAppDispatch();
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );
  const updateOrMatch = backend.updateOrMatchAttributions.useMutation();
  const modifyOrMatchOnlyOnOneResource =
    backend.modifyOrMatchOnlyOnOneResource.useMutation();
  const isSaving =
    updateOrMatch.isPending || modifyOrMatchOnlyOnOneResource.isPending;
  const selectionSummaryQuery = backend.getAttributionSelectionSummary.useQuery(
    {
      selection: selection ?? {
        mode: 'explicit',
        attributionUuids: attributionIdsToSave,
      },
    },
    { enabled: open && selection?.mode === 'allMatching' },
  );
  const aggregateSummary =
    selection?.mode === 'allMatching' ? selectionSummaryQuery.data : undefined;
  const {
    attributions: attributionsToSave,
    linkedResourceCount,
    linkedResourcesTreeState,
    mixedAttributionCount,
    isResourceInfoReady,
    isLocalActionAvailable,
    isSelectedResourceReadonly,
  } = useLinkedAttributionActionData({
    attributionIds: attributionIdsToSave,
    open,
    isMutationPending: isSaving,
    selection,
  });
  const modifiedAttributionsToSave = useMemo(
    () =>
      attributionsToSave?.[selectedAttributionId]
        ? {
            ...attributionsToSave,
            [selectedAttributionId]: temporaryDisplayPackageInfo,
          }
        : attributionsToSave,
    [attributionsToSave, selectedAttributionId, temporaryDisplayPackageInfo],
  );
  const focusedAttributionOverride = useMemo(
    () =>
      selectedAttributionId
        ? { [selectedAttributionId]: temporaryDisplayPackageInfo }
        : undefined,
    [selectedAttributionId, temporaryDisplayPackageInfo],
  );
  const areAllAttributionsPreselected = aggregateSummary
    ? aggregateSummary.preSelectedCount === aggregateSummary.selectedCount
    : attributionsToSave
      ? Object.values(attributionsToSave).every(
          (attribution) => attribution.preSelected,
        )
      : undefined;

  const handleSaveGlobally = async () => {
    if (selection?.mode === 'allMatching') {
      const result = await updateOrMatch.mutateAsync({
        selection,
        attributions: focusedAttributionOverride,
        focusedAttributionUuid: selectedAttributionId,
      });
      dispatch(
        applyFocusedAttributionOutcome(result.focusedAttributionOutcome),
      );
    } else if (modifiedAttributionsToSave) {
      const result = await updateOrMatch.mutateAsync({
        attributions: modifiedAttributionsToSave,
        focusedAttributionUuid: selectedAttributionId,
      });
      dispatch(
        applyFocusedAttributionOutcome(result.focusedAttributionOutcome),
      );
    }
    clearSelection?.();
    onClose();
  };

  const handleSaveOnResource = async () => {
    if (selection?.mode === 'allMatching') {
      const result = await modifyOrMatchOnlyOnOneResource.mutateAsync({
        resourcePath: selectedResourceId,
        selection,
        attributions: focusedAttributionOverride,
        focusedAttributionUuid: selectedAttributionId,
      });
      dispatch(
        applyFocusedAttributionOutcome(result.focusedAttributionOutcome),
      );
    } else if (modifiedAttributionsToSave) {
      const result = await modifyOrMatchOnlyOnOneResource.mutateAsync({
        resourcePath: selectedResourceId,
        attributions: modifiedAttributionsToSave,
        focusedAttributionUuid: selectedAttributionId,
      });
      dispatch(
        applyFocusedAttributionOutcome(result.focusedAttributionOutcome),
      );
    }
    clearSelection?.();
    onClose();
  };

  return (
    <ConfirmAttributionActionPopup
      header={
        areAllAttributionsPreselected
          ? text.saveAttributionsPopup.titleConfirm
          : text.saveAttributionsPopup.titleSave
      }
      localAction={{
        isPending: modifyOrMatchOnlyOnOneResource.isPending,
        onClick: handleSaveOnResource,
        buttonText: areAllAttributionsPreselected
          ? text.saveAttributionsPopup.confirmLocally
          : text.saveAttributionsPopup.saveLocally,
      }}
      globalAction={{
        isPending: updateOrMatch.isPending,
        onClick: handleSaveGlobally,
        color: 'error',
        buttonText:
          (aggregateSummary?.writableLinkedResourceCount ??
            linkedResourceCount ??
            0) > 1
            ? areAllAttributionsPreselected
              ? text.saveAttributionsPopup.confirmGlobally
              : text.saveAttributionsPopup.saveGlobally
            : areAllAttributionsPreselected
              ? text.saveAttributionsPopup.confirm
              : text.saveAttributionsPopup.save,
      }}
      attributions={
        selection?.mode === 'allMatching' ? {} : modifiedAttributionsToSave
      }
      onClose={onClose}
      description={(areAllAttributionsPreselected
        ? text.saveAttributionsPopup.confirmAttributions
        : text.saveAttributionsPopup.saveAttributions)({
        attributions:
          selection?.mode === 'allMatching'
            ? maybePluralize(
                aggregateSummary?.selectedCount ?? 0,
                text.packageLists.attribution,
              )
            : maybePluralize(
                attributionIdsToSave.length,
                text.packageLists.attribution,
              ),
        resources: maybePluralize(
          aggregateSummary?.writableLinkedResourceCount ??
            linkedResourceCount ??
            1,
          text.saveAttributionsPopup.resource,
          { showOne: true },
        ),
      })}
      mixedWarning={text.confirmAttributionActionPopup.mixedWarning(
        aggregateSummary?.mixedCount ?? mixedAttributionCount,
      )}
      linkedResourcesTreeState={linkedResourcesTreeState}
      mixedAttributionCount={
        aggregateSummary?.mixedCount ?? mixedAttributionCount
      }
      isResourceInfoReady={
        selection?.mode === 'allMatching'
          ? selectionSummaryQuery.isSuccess
          : isResourceInfoReady
      }
      isLocalActionAvailable={
        aggregateSummary
          ? aggregateSummary.allLinkedToSelectedResource &&
            aggregateSummary.writableLinkedResourceCount > 1 &&
            !isSelectedResourceReadonly
          : isLocalActionAvailable
      }
      selection={selection}
      open={open}
      ariaLabel={text.saveAttributionsPopup.ariaLabel}
    />
  );
};
