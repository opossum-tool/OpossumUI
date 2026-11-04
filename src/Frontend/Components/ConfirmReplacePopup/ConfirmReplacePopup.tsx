// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTypography from '@mui/material/Typography';
import { skipToken } from '@tanstack/react-query';

import { excludeAttributionFromAllMatchingSelection } from '../../../shared/attribution-selection';
import type { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch } from '../../state/hooks';
import { useAttributionSelectionForReplacement } from '../../state/variables/use-attribution-selection-for-replacement';
import { backend } from '../../util/backendClient';
import { maybePluralize } from '../../util/maybe-pluralize';
import { useFocusedAttributionOutcomeBeforeInvalidation } from '../../util/use-focused-attribution-outcome';
import { useAttributionSelectionData } from '../AttributionAction/use-attribution-selection-data';
import { AttributionCardList } from '../AttributionCardList/AttributionCardList';
import { ConfirmAttributionActionPopup } from '../ConfirmAttributionActionPopup/ConfirmAttributionActionPopup';
import {
  popupFixedSectionSx,
  popupScrollableContentSx,
} from '../NotificationPopup/NotificationPopup.style';
import { useLinkedResourcesTree } from '../ResourceBrowser/LinkedResourcesTree/useLinkedResourcesTreeState';

interface Props {
  selectedAttribution: PackageInfo;
  open: boolean;
  onClose: () => void;
}

export const ConfirmReplacePopup = ({
  selectedAttribution,
  onClose,
  open,
}: Props) => {
  const dispatch = useAppDispatch();

  const [selectionForReplacement, setSelectionForReplacement] =
    useAttributionSelectionForReplacement();
  const attributionIdsForReplacement =
    selectionForReplacement?.mode === 'explicit'
      ? selectionForReplacement.attributionUuids
      : [];

  const handleFocusedAttributionOutcome =
    useFocusedAttributionOutcomeBeforeInvalidation();
  const updateAttributions = backend.updateAttributions.useMutation({
    onBeforeInvalidation: handleFocusedAttributionOutcome,
  });
  const replaceAttributions = backend.replaceAttributions.useMutation();
  const replacementPreview = backend.getAttributionPreview.useQuery(
    open ? { attributionUuids: [selectedAttribution.id] } : skipToken,
  );
  const isReplacing =
    updateAttributions.isPending || replaceAttributions.isPending;
  const selectionForConfirmation = selectionForReplacement
    ? excludeAttributionFromAllMatchingSelection(
        selectionForReplacement,
        selectedAttribution.id,
      )
    : null;

  const {
    attributions: attributionsForReplacement,
    attributionIds,
    isQueryWideSelection,
    isSelectionDataReady,
    selectionMetadata,
  } = useAttributionSelectionData({
    open,
    isMutationPending: isReplacing,
    selection: selectionForConfirmation ?? {
      mode: 'explicit',
      attributionUuids: [],
    },
  });
  const {
    data: linkedResourcesTreeState,
    isLoading: isTreeLoading,
    isError: hasTreeError,
  } = useLinkedResourcesTree({
    onAttributionUuids: [
      ...new Set([
        ...attributionIds,
        ...(selectedAttribution.preSelected ? [selectedAttribution.id] : []),
      ]),
    ],
    enabled:
      open && !isReplacing && isSelectionDataReady && !isQueryWideSelection,
    onlyWritable: true,
  });
  const isResourceInfoReady =
    isSelectionDataReady &&
    (isQueryWideSelection || (!isTreeLoading && !hasTreeError));
  const mixedAttributionCount =
    selectionMetadata.mixedAttributionCount +
    (selectedAttribution.preSelected &&
    selectedAttribution.resourceAccess === 'mixed' &&
    !attributionIdsForReplacement.includes(selectedAttribution.id)
      ? 1
      : 0);

  const handleReplace = async () => {
    if (!selectionForReplacement) {
      return;
    }

    let replacementAttribution = selectedAttribution;
    if (selectedAttribution.preSelected) {
      const { focusedAttributionOutcome } =
        await updateAttributions.mutateAsync({
          attributions: {
            [selectedAttribution.id]: {
              ...selectedAttribution,
              preSelected: undefined,
            },
          },
          focusedAttributionUuid: selectedAttribution.id,
        });
      const replacementId =
        focusedAttributionOutcome.status === 'remapped'
          ? focusedAttributionOutcome.newAttributionUuid
          : selectedAttribution.id;
      replacementAttribution = {
        ...selectedAttribution,
        id: replacementId,
        preSelected: undefined,
      };
    }
    await replaceAttributions.mutateAsync({
      selection: selectionForConfirmation ?? selectionForReplacement,
      attributionUuidToReplaceWith: replacementAttribution.id,
    });
    setSelectionForReplacement(null);
    dispatch(
      changeSelectedAttributionOrOpenUnsavedPopup(replacementAttribution),
    );
    onClose();
  };
  return (
    <ConfirmAttributionActionPopup
      header={text.replaceAttributionsPopup.title}
      globalAction={{
        disabled: isReplacing,
        isPending: isReplacing,
        onClick: handleReplace,
        buttonText: text.replaceAttributionsPopup.replace,
        color: 'error',
      }}
      onClose={onClose}
      open={open}
      ariaLabel={'confirm replace popup'}
      description={text.replaceAttributionsPopup.removeAttributions(
        maybePluralize(
          selectionMetadata.selectedAttributionCount,
          text.packageLists.attribution,
        ),
      )}
      mixedWarning={text.confirmAttributionActionPopup.mixedWarning(
        mixedAttributionCount,
      )}
      mixedAttributionCount={mixedAttributionCount}
      attributions={attributionsForReplacement}
      linkedResourcesTreeState={linkedResourcesTreeState}
      isResourceInfoReady={isResourceInfoReady}
      isLocalActionAvailable={false}
      selection={
        selectionForConfirmation ?? { mode: 'explicit', attributionUuids: [] }
      }
      attributionCount={selectionMetadata.selectedAttributionCount}
      attributionListTestId={'removed-attributions'}
    >
      <MuiTypography sx={popupFixedSectionSx}>
        {text.replaceAttributionsPopup.replacement}
      </MuiTypography>
      <AttributionCardList
        attributions={[
          {
            ...selectedAttribution,
            writableLinkedResourceCount:
              replacementPreview.data?.[selectedAttribution.id]
                ?.writableLinkedResourceCount,
          },
        ]}
        testId={'added attributions'}
        sx={popupScrollableContentSx}
      />
    </ConfirmAttributionActionPopup>
  );
};
