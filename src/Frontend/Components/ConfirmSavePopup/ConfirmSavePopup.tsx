// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useMemo } from 'react';

import type { MutationResult } from '../../../ElectronBackend/api/mutations';
import type { AttributionSelection } from '../../../shared/attribution-selection';
import type { Attributions } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { backend } from '../../util/backendClient';
import { maybePluralize } from '../../util/maybe-pluralize';
import { useFocusedAttributionOutcomeBeforeInvalidation } from '../../util/use-focused-attribution-outcome';
import { useLinkedAttributionActionData } from '../AttributionAction/useLinkedAttributionActionData';
import { ConfirmAttributionActionPopup } from '../ConfirmAttributionActionPopup/ConfirmAttributionActionPopup';
import { toast } from '../Toaster';

interface Props {
  selection: AttributionSelection;
  open: boolean;
  onClose: () => void;
  attributions?: Attributions;
  focusedAttributionUuid?: string;
  allowLocalSave?: boolean;
  action?: 'save' | 'confirm';
  onAcceptDrafts?: () => void;
  onSaveComplete?: (result: SaveMutationResult) => void;
}

export type SaveMutationResult = MutationResult<
  'updateOrMatchAttributions' | 'modifyOrMatchOnlyOnOneResource'
>;

export const ConfirmSavePopup: React.FC<Props> = ({
  selection,
  open,
  onClose,
  attributions: attributionOverrides,
  focusedAttributionUuid,
  allowLocalSave = true,
  action,
  onAcceptDrafts,
  onSaveComplete,
}) => {
  const handleFocusedAttributionOutcome =
    useFocusedAttributionOutcomeBeforeInvalidation();
  const handleBeforeInvalidation = useCallback(
    (result: SaveMutationResult) => {
      onAcceptDrafts?.();
      handleFocusedAttributionOutcome(result);
    },
    [handleFocusedAttributionOutcome, onAcceptDrafts],
  );
  const updateOrMatch = backend.updateOrMatchAttributions.useMutation({
    onBeforeInvalidation: handleBeforeInvalidation,
  });
  const modifyOrMatchOnlyOnOneResource =
    backend.modifyOrMatchOnlyOnOneResource.useMutation({
      onBeforeInvalidation: handleBeforeInvalidation,
    });
  const isSaving =
    updateOrMatch.isPending || modifyOrMatchOnlyOnOneResource.isPending;
  const {
    selectedResourceId,
    attributions: attributionsToSave,
    linkedResourcesTreeState,
    actionSummary,
  } = useLinkedAttributionActionData({
    open,
    isMutationPending: isSaving,
    selection,
  });
  const resolvedAttributions = useMemo(() => {
    if (selection.mode === 'allMatching') {
      return attributionOverrides;
    }
    if (!attributionsToSave) {
      return undefined;
    }
    return Object.fromEntries(
      Object.entries(attributionsToSave).map(([id, attribution]) => [
        id,
        attributionOverrides?.[id] ?? attribution,
      ]),
    );
  }, [attributionOverrides, attributionsToSave, selection.mode]);

  const isConfirmAction =
    action === 'confirm' ||
    (action === undefined && actionSummary.areAllAttributionsPreselected);

  const handleSave = async (saveLocally: boolean) => {
    if (isSaving) {
      return;
    }
    try {
      const params = {
        selection,
        attributions: resolvedAttributions,
        focusedAttributionUuid,
      };
      const result = saveLocally
        ? await modifyOrMatchOnlyOnOneResource.mutateAsync({
            ...params,
            resourcePath: selectedResourceId,
          })
        : await updateOrMatch.mutateAsync(params);
      onClose();
      onSaveComplete?.(result);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : text.saveAttributionsPopup.saveFailure,
      );
    }
  };

  return (
    <ConfirmAttributionActionPopup
      header={
        isConfirmAction
          ? text.saveAttributionsPopup.titleConfirm
          : text.saveAttributionsPopup.titleSave
      }
      localAction={
        allowLocalSave
          ? {
              isPending: modifyOrMatchOnlyOnOneResource.isPending,
              disabled: isSaving,
              onClick: () => handleSave(true),
              buttonText: isConfirmAction
                ? text.saveAttributionsPopup.confirmLocally
                : text.saveAttributionsPopup.saveLocally,
            }
          : undefined
      }
      globalAction={{
        isPending: updateOrMatch.isPending,
        disabled: isSaving,
        onClick: () => handleSave(false),
        color: 'error',
        buttonText:
          (actionSummary.linkedResourceCount ?? 0) > 1
            ? isConfirmAction
              ? text.saveAttributionsPopup.confirmGlobally
              : text.saveAttributionsPopup.saveGlobally
            : isConfirmAction
              ? text.saveAttributionsPopup.confirm
              : text.saveAttributionsPopup.save,
      }}
      attributions={resolvedAttributions}
      onClose={onClose}
      description={(isConfirmAction
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
      isLocalActionAvailable={
        allowLocalSave && actionSummary.isLocalActionAvailable
      }
      isCloseDisabled={isSaving}
      selection={selection}
      attributionCount={actionSummary.selectedAttributionCount}
      open={open}
      ariaLabel={text.saveAttributionsPopup.ariaLabel}
    />
  );
};
