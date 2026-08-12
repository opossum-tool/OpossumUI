// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { text } from '../../../shared/text';
import { setSelectedAttributionId } from '../../state/actions/resource-actions/audit-view-simple-actions';
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
}

export const ConfirmDeletePopup: React.FC<Props> = ({
  attributionIdsToDelete,
  open,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const clearSelectedAttributionIfDeleted = () => {
    if (attributionIdsToDelete.includes(selectedAttributionId)) {
      dispatch(setSelectedAttributionId(''));
    }
  };
  const deleteAttributions = backend.deleteAttributions.useMutation({
    onBeforeInvalidation: clearSelectedAttributionIfDeleted,
  });
  const unlinkResourceFromAttributions =
    backend.unlinkResourceFromAttributions.useMutation({
      onBeforeInvalidation: clearSelectedAttributionIfDeleted,
    });
  const isDeleting =
    deleteAttributions.isPending || unlinkResourceFromAttributions.isPending;
  const {
    attributions: attributionsToDelete,
    linkedResourceCount,
    linkedResourcesTreeState,
    mixedAttributionCount,
    isResourceInfoReady,
    isLocalActionAvailable,
    selectedResourceId,
  } = useLinkedAttributionActionData({
    attributionIds: attributionIdsToDelete,
    open,
    isMutationPending: isDeleting,
    skipWithoutSelectedResource: true,
  });

  const handleDelete = async () => {
    await deleteAttributions.mutateAsync({
      attributionUuids: attributionIdsToDelete,
    });
    onClose();
  };
  const handleDeleteOnResource = async () => {
    await unlinkResourceFromAttributions.mutateAsync({
      resourcePath: selectedResourceId,
      attributionUuids: attributionIdsToDelete,
    });
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
          linkedResourceCount && linkedResourceCount > 1
            ? text.deleteAttributionsPopup.deleteGlobally
            : text.deleteAttributionsPopup.delete,
        color: 'error',
      }}
      attributions={attributionsToDelete}
      onClose={onClose}
      description={text.deleteAttributionsPopup.deleteAttributions({
        attributions: maybePluralize(
          attributionIdsToDelete.length,
          text.packageLists.attribution,
        ),
        resources: maybePluralize(
          linkedResourceCount ?? 1,
          text.deleteAttributionsPopup.resource,
          { showOne: true },
        ),
      })}
      mixedWarning={text.deleteAttributionsPopup.mixedWarning(
        mixedAttributionCount,
      )}
      linkedResourcesTreeState={linkedResourcesTreeState}
      mixedAttributionCount={mixedAttributionCount}
      isResourceInfoReady={isResourceInfoReady}
      isLocalActionAvailable={isLocalActionAvailable}
      open={open}
      ariaLabel={text.deleteAttributionsPopup.ariaLabel}
    />
  );
};
