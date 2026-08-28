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
  selection: AttributionSelection;
  open: boolean;
  onClose: () => void;
  clearSelection?: () => void;
}

export const ConfirmDeletePopup: React.FC<Props> = ({
  selection,
  open,
  onClose,
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
  const isDeleting =
    deleteAttributions.isPending || unlinkResourceFromAttributions.isPending;
  const {
    attributions: attributionsToDelete,
    linkedResourcesTreeState,
    selectedResourceId,
    actionSummary,
  } = useLinkedAttributionActionData({
    open,
    isMutationPending: isDeleting,
    selection,
  });

  const handleDelete = async () => {
    await deleteAttributions.mutateAsync({
      selection,
      focusedAttributionUuid: selectedAttributionId,
    });
    clearSelection?.();
    onClose();
  };
  const handleDeleteOnResource = async () => {
    await unlinkResourceFromAttributions.mutateAsync({
      resourcePath: selectedResourceId,
      selection,
      focusedAttributionUuid: selectedAttributionId,
    });
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
          (actionSummary.linkedResourceCount ?? 0) > 1
            ? text.deleteAttributionsPopup.deleteGlobally
            : text.deleteAttributionsPopup.delete,
        color: 'error',
      }}
      attributions={attributionsToDelete}
      onClose={onClose}
      description={text.deleteAttributionsPopup.deleteAttributions({
        attributions: maybePluralize(
          actionSummary.selectedAttributionCount,
          text.packageLists.attribution,
        ),
        resources: maybePluralize(
          actionSummary.linkedResourceCount ?? 1,
          text.deleteAttributionsPopup.resource,
          { showOne: true },
        ),
      })}
      mixedWarning={text.deleteAttributionsPopup.mixedWarning(
        actionSummary.mixedAttributionCount,
      )}
      linkedResourcesTreeState={linkedResourcesTreeState}
      mixedAttributionCount={actionSummary.mixedAttributionCount}
      isResourceInfoReady={actionSummary.isResourceInfoReady}
      isLocalActionAvailable={actionSummary.isLocalActionAvailable}
      selection={selection}
      open={open}
      ariaLabel={text.deleteAttributionsPopup.ariaLabel}
    />
  );
};
