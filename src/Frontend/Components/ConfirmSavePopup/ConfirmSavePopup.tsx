// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';

import { text } from '../../../shared/text';
import { setSelectedAttributionIdIfRemapped } from '../../state/actions/resource-actions/navigation-actions';
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
}

export const ConfirmSavePopup: React.FC<Props> = ({
  attributionIdsToSave,
  open,
  onClose,
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
    attributions: attributionsToSave,
    linkedResourceCount,
    linkedResourcesTreeState,
    mixedAttributionCount,
    isResourceInfoReady,
    isLocalActionAvailable,
  } = useLinkedAttributionActionData({
    attributionIds: attributionIdsToSave,
    open,
    isMutationPending: isSaving,
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
  const areAllAttributionsPreselected = attributionsToSave
    ? Object.values(attributionsToSave).every(
        (attribution) => attribution.preSelected,
      )
    : undefined;

  const handleSaveGlobally = async () => {
    if (modifiedAttributionsToSave) {
      const result = await updateOrMatch.mutateAsync({
        attributions: modifiedAttributionsToSave,
      });
      dispatch(
        setSelectedAttributionIdIfRemapped(
          result.oldUuidsToNewUuids,
          selectedAttributionId,
        ),
      );
    }
    onClose();
  };

  const handleSaveOnResource = async () => {
    if (modifiedAttributionsToSave) {
      const result = await modifyOrMatchOnlyOnOneResource.mutateAsync({
        resourcePath: selectedResourceId,
        attributions: modifiedAttributionsToSave,
      });
      dispatch(
        setSelectedAttributionIdIfRemapped(
          result.oldUuidsToNewUuids,
          selectedAttributionId,
        ),
      );
    }
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
          linkedResourceCount && linkedResourceCount > 1
            ? areAllAttributionsPreselected
              ? text.saveAttributionsPopup.confirmGlobally
              : text.saveAttributionsPopup.saveGlobally
            : areAllAttributionsPreselected
              ? text.saveAttributionsPopup.confirm
              : text.saveAttributionsPopup.save,
      }}
      attributions={modifiedAttributionsToSave}
      onClose={onClose}
      description={(areAllAttributionsPreselected
        ? text.saveAttributionsPopup.confirmAttributions
        : text.saveAttributionsPopup.saveAttributions)({
        attributions: maybePluralize(
          attributionIdsToSave.length,
          text.packageLists.attribution,
        ),
        resources: maybePluralize(
          linkedResourceCount ?? 1,
          text.saveAttributionsPopup.resource,
          { showOne: true },
        ),
      })}
      mixedWarning={text.confirmAttributionActionPopup.mixedWarning(
        mixedAttributionCount,
        maybePluralize(
          mixedAttributionCount,
          text.confirmAttributionActionPopup.attribution,
        ),
      )}
      linkedResourcesTreeState={linkedResourcesTreeState}
      mixedAttributionCount={mixedAttributionCount}
      isResourceInfoReady={isResourceInfoReady}
      isLocalActionAvailable={isLocalActionAvailable}
      open={open}
      ariaLabel={text.saveAttributionsPopup.ariaLabel}
    />
  );
};
