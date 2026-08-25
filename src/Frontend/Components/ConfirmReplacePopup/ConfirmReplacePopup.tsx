// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiAlert from '@mui/material/Alert';
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
import { AttributionCardList } from '../AttributionCardList/AttributionCardList';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

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

  const updateAttributions = backend.updateAttributions.useMutation();
  const replaceAttributions = backend.replaceAttributions.useMutation();
  const isReplacing =
    updateAttributions.isPending || replaceAttributions.isPending;
  const isQueryWideSelection = selectionForReplacement?.mode === 'allMatching';
  const selectionForConfirmation = selectionForReplacement
    ? excludeAttributionFromAllMatchingSelection(
        selectionForReplacement,
        selectedAttribution.id,
      )
    : null;

  const { data: attributionsForReplacement, isSuccess: areAttributionsReady } =
    backend.listAttributions.useQuery(
      open && !isReplacing && !isQueryWideSelection
        ? {
            uuids: attributionIdsForReplacement,
          }
        : skipToken,
    );
  const selectionSummaryQuery = backend.getAttributionSelectionSummary.useQuery(
    {
      selection: selectionForConfirmation ?? {
        mode: 'explicit',
        attributionUuids: attributionIdsForReplacement,
      },
    },
    { enabled: open && !isReplacing && isQueryWideSelection },
  );
  const selectionSummary = isQueryWideSelection
    ? selectionSummaryQuery.data
    : undefined;
  const mixedAttributionCount =
    (selectionSummary?.mixedCount ??
      (attributionsForReplacement
        ? Object.values(attributionsForReplacement).filter(
            (attribution) => attribution.resourceAccess === 'mixed',
          ).length
        : 0)) +
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
      const { oldUuidsToNewUuids } = await updateAttributions.mutateAsync({
        attributions: {
          [selectedAttribution.id]: {
            ...selectedAttribution,
            preSelected: undefined,
          },
        },
      });
      replacementAttribution = {
        ...selectedAttribution,
        id: oldUuidsToNewUuids[selectedAttribution.id],
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
  const { count, ...attributionWithoutCount } = selectedAttribution;

  return (
    <NotificationPopup
      header={text.replaceAttributionsPopup.title}
      leftButtonConfig={{
        disabled:
          isReplacing ||
          (isQueryWideSelection
            ? !selectionSummaryQuery.isSuccess
            : !areAttributionsReady),
        loading: isReplacing,
        onClick: handleReplace,
        buttonText: text.replaceAttributionsPopup.replace,
        color: 'error',
      }}
      rightButtonConfig={{
        disabled: isReplacing,
        onClick: onClose,
        buttonText: text.buttons.cancel,
        color: 'secondary',
      }}
      isOpen={open}
      aria-label={'confirm replace popup'}
      width={500}
      sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      {mixedAttributionCount > 0 && (
        <MuiAlert severity={'warning'}>
          {text.confirmAttributionActionPopup.mixedWarning(
            mixedAttributionCount,
          )}
        </MuiAlert>
      )}
      <MuiTypography>
        {text.replaceAttributionsPopup.removeAttributions(
          isQueryWideSelection
            ? maybePluralize(
                selectionSummary?.selectedCount ?? 0,
                text.packageLists.attribution,
              )
            : maybePluralize(
                attributionIdsForReplacement.length,
                text.packageLists.attribution,
              ),
        )}
      </MuiTypography>
      {!isQueryWideSelection && attributionsForReplacement ? (
        <AttributionCardList
          attributions={Object.values(attributionsForReplacement)}
          testId={'removed-attributions'}
        />
      ) : null}
      <MuiTypography>{text.replaceAttributionsPopup.replacement}</MuiTypography>
      <AttributionCardList
        attributions={[attributionWithoutCount]}
        testId={'added attributions'}
      />
    </NotificationPopup>
  );
};
