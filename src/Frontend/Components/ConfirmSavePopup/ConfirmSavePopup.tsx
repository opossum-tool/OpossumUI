// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';

import type { AttributionSelection } from '../../../shared/attribution-selection';
import { text } from '../../../shared/text';
import { useAppSelector } from '../../state/hooks';
import {
  getSelectedAttributionId,
  getSelectedResourceId,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/resource-selectors';
import { backend } from '../../util/backendClient';
import { maybePluralize } from '../../util/maybe-pluralize';
import { useFocusedAttributionOutcomeBeforeInvalidation } from '../../util/use-focused-attribution-outcome';
import { useLinkedAttributionActionData } from '../AttributionAction/useLinkedAttributionActionData';
import { ConfirmAttributionActionPopup } from '../ConfirmAttributionActionPopup/ConfirmAttributionActionPopup';

interface Props {
  selection: AttributionSelection;
  open: boolean;
  onClose: () => void;
  clearSelection?: () => void;
}

export const ConfirmSavePopup: React.FC<Props> = ({
  selection,
  open,
  onClose,
  clearSelection,
}) => {
  const handleFocusedAttributionOutcome =
    useFocusedAttributionOutcomeBeforeInvalidation();
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );
  const updateOrMatch = backend.updateOrMatchAttributions.useMutation({
    onBeforeInvalidation: handleFocusedAttributionOutcome,
  });
  const modifyOrMatchOnlyOnOneResource =
    backend.modifyOrMatchOnlyOnOneResource.useMutation({
      onBeforeInvalidation: handleFocusedAttributionOutcome,
    });
  const isSaving =
    updateOrMatch.isPending || modifyOrMatchOnlyOnOneResource.isPending;
  const {
    attributions: attributionsToSave,
    linkedResourcesTreeState,
    actionSummary,
  } = useLinkedAttributionActionData({
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
    await updateOrMatch.mutateAsync({
      selection,
      attributions: modifiedAttributionsToSave,
      focusedAttributionUuid: selectedAttributionId,
    });
    clearSelection?.();
    onClose();
  };

  const handleSaveOnResource = async () => {
    await modifyOrMatchOnlyOnOneResource.mutateAsync({
      resourcePath: selectedResourceId,
      selection,
      attributions: modifiedAttributionsToSave,
      focusedAttributionUuid: selectedAttributionId,
    });
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
      selection={selection}
      open={open}
      ariaLabel={text.saveAttributionsPopup.ariaLabel}
    />
  );
};
