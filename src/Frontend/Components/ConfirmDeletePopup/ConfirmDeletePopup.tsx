// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { AttributionSelection } from '../../../shared/attribution-selection';
import { text } from '../../../shared/text';
import { applyFocusedAttributionOutcome } from '../../state/actions/resource-actions/navigation-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getSelectedAttributionId } from '../../state/selectors/resource-selectors';
import { backend } from '../../util/backendClient';
import { maybePluralize } from '../../util/maybe-pluralize';
import { useLinkedAttributionActionData } from '../AttributionAction/useLinkedAttributionActionData';
import { ConfirmAttributionActionPopup } from '../ConfirmAttributionActionPopup/ConfirmAttributionActionPopup';

interface Props {
  attributionIdsToDelete: Array<string>;
  open: boolean;
  onClose: () => void;
  selection?: AttributionSelection;
  clearSelection?: () => void;
}

export const ConfirmDeletePopup: React.FC<Props> = ({
  attributionIdsToDelete,
  open,
  onClose,
  selection,
  clearSelection,
}) => {
  const dispatch = useAppDispatch();
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const deleteAttributions = backend.deleteAttributions.useMutation({
    onBeforeInvalidation: ({ focusedAttributionOutcome }) =>
      dispatch(applyFocusedAttributionOutcome(focusedAttributionOutcome)),
  });
  const unlinkResourceFromAttributions =
    backend.unlinkResourceFromAttributions.useMutation({
      onBeforeInvalidation: ({ focusedAttributionOutcome }) =>
        dispatch(applyFocusedAttributionOutcome(focusedAttributionOutcome)),
    });
  const selectionSummaryQuery = backend.getAttributionSelectionSummary.useQuery(
    {
      selection: selection ?? {
        mode: 'explicit',
        attributionUuids: attributionIdsToDelete,
      },
    },
    { enabled: open && selection?.mode === 'allMatching' },
  );
  const aggregateSummary =
    selection?.mode === 'allMatching' ? selectionSummaryQuery.data : undefined;
  const isDeleting =
    deleteAttributions.isPending || unlinkResourceFromAttributions.isPending;
  const {
    attributions: attributionsToDelete,
    linkedResourceCount,
    linkedResourcesTreeState,
    mixedAttributionCount,
    isResourceInfoReady,
    isLocalActionAvailable,
    isSelectedResourceReadonly,
    selectedResourceId,
  } = useLinkedAttributionActionData({
    attributionIds: attributionIdsToDelete,
    open,
    isMutationPending: isDeleting,
    selection,
  });

  const handleDelete = async () => {
    await deleteAttributions.mutateAsync(
      selection?.mode === 'allMatching'
        ? { selection, focusedAttributionUuid: selectedAttributionId }
        : {
            attributionUuids: attributionIdsToDelete,
            focusedAttributionUuid: selectedAttributionId,
          },
    );
    clearSelection?.();
    onClose();
  };
  const handleDeleteOnResource = async () => {
    await unlinkResourceFromAttributions.mutateAsync(
      selection?.mode === 'allMatching'
        ? {
            resourcePath: selectedResourceId,
            selection,
            focusedAttributionUuid: selectedAttributionId,
          }
        : {
            resourcePath: selectedResourceId,
            attributionUuids: attributionIdsToDelete,
            focusedAttributionUuid: selectedAttributionId,
          },
    );
    clearSelection?.();
    onClose();
  };

  return (
    <ConfirmAttributionActionPopup
      header={text.deleteAttributionsPopup.title}
      localAction={{
        isPending: unlinkResourceFromAttributions.isPending,
        onClick: handleDeleteOnResource,
        buttonText: text.deleteAttributionsPopup.deleteLocally,
        color: 'primary',
      }}
      globalAction={{
        isPending: deleteAttributions.isPending,
        onClick: handleDelete,
        buttonText:
          (aggregateSummary?.writableLinkedResourceCount ??
            linkedResourceCount ??
            0) > 1
            ? text.deleteAttributionsPopup.deleteGlobally
            : text.deleteAttributionsPopup.delete,
        color: 'error',
      }}
      attributions={
        selection?.mode === 'allMatching' ? {} : attributionsToDelete
      }
      onClose={onClose}
      description={text.deleteAttributionsPopup.deleteAttributions({
        attributions:
          selection?.mode === 'allMatching'
            ? maybePluralize(
                aggregateSummary?.selectedCount ?? 0,
                text.packageLists.attribution,
              )
            : maybePluralize(
                attributionIdsToDelete.length,
                text.packageLists.attribution,
              ),
        resources: maybePluralize(
          aggregateSummary?.writableLinkedResourceCount ??
            linkedResourceCount ??
            1,
          text.deleteAttributionsPopup.resource,
          { showOne: true },
        ),
      })}
      mixedWarning={text.deleteAttributionsPopup.mixedWarning(
        aggregateSummary?.mixedCount ?? mixedAttributionCount,
      )}
      linkedResourcesTreeState={linkedResourcesTreeState}
      mixedAttributionCount={
        aggregateSummary?.mixedCount ?? mixedAttributionCount
      }
      isResourceInfoReady={
        aggregateSummary
          ? !selectionSummaryQuery.isLoading
          : isResourceInfoReady
      }
      isLocalActionAvailable={
        aggregateSummary
          ? aggregateSummary.allLinkedToSelectedResource &&
            aggregateSummary.writableLinkedResourceCount > 1 &&
            !isSelectedResourceReadonly
          : isLocalActionAvailable
      }
      aggregateSelection={selection?.mode === 'allMatching'}
      open={open}
      ariaLabel={text.deleteAttributionsPopup.ariaLabel}
    />
  );
};
