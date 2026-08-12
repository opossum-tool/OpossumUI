// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiAlert from '@mui/material/Alert';
import MuiTypography from '@mui/material/Typography';
import { skipToken } from '@tanstack/react-query';

import type { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch } from '../../state/hooks';
import { useAttributionIdsForReplacement } from '../../state/variables/use-attribution-ids-for-replacement';
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

  const [attributionIdsForReplacement, setAttributionIdsForReplacement] =
    useAttributionIdsForReplacement();

  const updateAttributions = backend.updateAttributions.useMutation();
  const replaceAttributions = backend.replaceAttributions.useMutation();
  const isReplacing =
    updateAttributions.isPending || replaceAttributions.isPending;

  const { data: attributionsForReplacement, isSuccess: areAttributionsReady } =
    backend.listAttributions.useQuery(
      open && !isReplacing
        ? {
            uuids: attributionIdsForReplacement,
          }
        : skipToken,
    );
  const attributionIdsThatMayBeSplit = selectedAttribution.preSelected
    ? Array.from(
        new Set([...attributionIdsForReplacement, selectedAttribution.id]),
      )
    : attributionIdsForReplacement;
  const resourceInfoQuery = backend.getResourceInfoOnAttributions.useQuery(
    open ? { attributionUuids: attributionIdsThatMayBeSplit } : skipToken,
  );
  const mixedAttributionCount = resourceInfoQuery.data
    ? Object.values(resourceInfoQuery.data).filter((info) => info.isMixed)
        .length
    : 0;

  const handleReplace = async () => {
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
      attributionUuidsToReplace: attributionIdsForReplacement,
      attributionUuidToReplaceWith: replacementAttribution.id,
    });
    setAttributionIdsForReplacement([]);
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
        disabled: isReplacing || !areAttributionsReady,
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
            maybePluralize(
              mixedAttributionCount,
              text.confirmAttributionActionPopup.attribution,
            ),
          )}
        </MuiAlert>
      )}
      <MuiTypography>
        {text.replaceAttributionsPopup.removeAttributions(
          maybePluralize(
            attributionIdsForReplacement.length,
            text.packageLists.attribution,
          ),
        )}
      </MuiTypography>
      {attributionsForReplacement ? (
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
