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
  const {
    selection: actionSelection,
    attributions: attributionsToSave,
    linkedResourcesTreeState,
    actionSummary,
  } = useLinkedAttributionActionData({
    attributionIds: attributionIdsToSave,
    open,
    isMutationPending: isSaving,
    selection,
  });
  const modifiedAttributionsToSave = useMemo(() => {
    if (!selectedAttributionId) {
      return attributionsToSave;
    }
    if (!attributionsToSave) {
      return { [selectedAttributionId]: temporaryDisplayPackageInfo };
    }
    return attributionsToSave[selectedAttributionId]
      ? {
          ...attributionsToSave,
          [selectedAttributionId]: temporaryDisplayPackageInfo,
        }
      : attributionsToSave;
  }, [attributionsToSave, selectedAttributionId, temporaryDisplayPackageInfo]);

  const handleSaveGlobally = async () => {
    const result = await updateOrMatch.mutateAsync({
      selection: actionSelection,
      attributions: modifiedAttributionsToSave,
      focusedAttributionUuid: selectedAttributionId,
    });
    dispatch(applyFocusedAttributionOutcome(result.focusedAttributionOutcome));
    clearSelection?.();
    onClose();
  };

  const handleSaveOnResource = async () => {
    const result = await modifyOrMatchOnlyOnOneResource.mutateAsync({
      resourcePath: selectedResourceId,
      selection: actionSelection,
      attributions: modifiedAttributionsToSave,
      focusedAttributionUuid: selectedAttributionId,
    });
    dispatch(applyFocusedAttributionOutcome(result.focusedAttributionOutcome));
    clearSelection?.();
    onClose();
  };

  return (
    <ConfirmAttributionActionPopup
      header={
        actionSummary.areAllAttributionsPreselected
          ? text.saveAttributionsPopup.titleConfirm
          : text.saveAttributionsPopup.titleSave
      }
      localAction={{
        isPending: modifyOrMatchOnlyOnOneResource.isPending,
        onClick: handleSaveOnResource,
        buttonText: actionSummary.areAllAttributionsPreselected
          ? text.saveAttributionsPopup.confirmLocally
          : text.saveAttributionsPopup.saveLocally,
      }}
      globalAction={{
        isPending: updateOrMatch.isPending,
        onClick: handleSaveGlobally,
        color: 'error',
        buttonText:
          (actionSummary.linkedResourceCount ?? 0) > 1
            ? actionSummary.areAllAttributionsPreselected
              ? text.saveAttributionsPopup.confirmGlobally
              : text.saveAttributionsPopup.saveGlobally
            : actionSummary.areAllAttributionsPreselected
              ? text.saveAttributionsPopup.confirm
              : text.saveAttributionsPopup.save,
      }}
      attributions={modifiedAttributionsToSave}
      onClose={onClose}
      description={(actionSummary.areAllAttributionsPreselected
        ? text.saveAttributionsPopup.confirmAttributions
        : text.saveAttributionsPopup.saveAttributions)({
        attributions: maybePluralize(
          actionSummary.selectedAttributionCount,
          text.packageLists.attribution,
        ),
        resources: maybePluralize(
          actionSummary.linkedResourceCount ?? 1,
          text.saveAttributionsPopup.resource,
          { showOne: true },
        ),
      })}
      mixedWarning={text.confirmAttributionActionPopup.mixedWarning(
        actionSummary.mixedAttributionCount,
      )}
      linkedResourcesTreeState={linkedResourcesTreeState}
      mixedAttributionCount={actionSummary.mixedAttributionCount}
      isResourceInfoReady={actionSummary.isResourceInfoReady}
      isLocalActionAvailable={actionSummary.isLocalActionAvailable}
      selection={actionSelection}
      open={open}
      ariaLabel={text.saveAttributionsPopup.ariaLabel}
    />
  );
};
