// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';
import MuiTypography from '@mui/material/Typography';
import { skipToken } from '@tanstack/react-query';

import { type PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch } from '../../state/hooks';
import { useAttributionIdsForReplacement } from '../../state/variables/use-attribution-ids-for-replacement';
import { backend } from '../../util/backendClient';
import { maybePluralize } from '../../util/maybe-pluralize';
import { CardList } from '../CardList/CardList';
import { PackageCard } from '../PackageCard/PackageCard';
import { StyledNotificationPopup } from './ConfirmReplacePopup.style';

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
  const replaceAttribution = backend.replaceAttribution.useMutation();
  const isReplacing =
    updateAttributions.isPending || replaceAttribution.isPending;

  const { data: attributionsForReplacement } =
    backend.listAttributions.useQuery(
      open && !isReplacing
        ? {
            uuids: attributionIdsForReplacement,
          }
        : skipToken,
    );

  const handleReplace = async () => {
    if (selectedAttribution.preSelected) {
      await updateAttributions.mutateAsync({
        attributions: {
          [selectedAttribution.id]: {
            ...selectedAttribution,
            preSelected: undefined,
          },
        },
      });
    }
    await Promise.all(
      attributionIdsForReplacement.map(async (attributionId) => {
        await replaceAttribution.mutateAsync({
          attributionIdToReplace: attributionId,
          attributionIdToReplaceWith: selectedAttribution.id,
        });
      }),
    );
    setAttributionIdsForReplacement([]);
    dispatch(changeSelectedAttributionOrOpenUnsavedPopup(selectedAttribution));
    onClose();
  };

  return (
    <StyledNotificationPopup
      header={text.replaceAttributionsPopup.title}
      leftButtonConfig={{
        loading: isReplacing,
        onClick: handleReplace,
        buttonText: text.replaceAttributionsPopup.replace,
        color: 'error',
      }}
      rightButtonConfig={{
        disabled: isReplacing,
        onClick: () => onClose(),
        buttonText: text.buttons.cancel,
        color: 'secondary',
      }}
      isOpen={open}
      aria-label={'confirm replace popup'}
      width={500}
    >
      {renderContent()}
    </StyledNotificationPopup>
  );

  function renderContent() {
    return (
      <>
        {renderAttributionsToRemove()}
        {renderAttributionToAdd()}
      </>
    );
  }

  function renderAttributionsToRemove() {
    return (
      <>
        <MuiTypography>
          {text.replaceAttributionsPopup.removeAttributions(
            maybePluralize(
              attributionIdsForReplacement.length,
              text.packageLists.attribution,
            ),
          )}
        </MuiTypography>
        {attributionsForReplacement ? (
          <CardList
            data={Object.values(attributionsForReplacement)}
            data-testid={'removed-attributions'}
            renderItemContent={(attribution, { index }) => {
              return (
                <>
                  <PackageCard packageInfo={attribution} />
                  {index + 1 !== attributionIdsForReplacement.length && (
                    <MuiDivider />
                  )}
                </>
              );
            }}
          />
        ) : null}
      </>
    );
  }

  function renderAttributionToAdd() {
    const { count, ...attributionWithoutCount } = selectedAttribution;
    return (
      <>
        <MuiTypography>
          {text.replaceAttributionsPopup.replacement}
        </MuiTypography>
        <CardList
          data={[attributionWithoutCount]}
          data-testid={'added attributions'}
          renderItemContent={(attribution) => (
            <PackageCard packageInfo={attribution} />
          )}
        />
      </>
    );
  }
};
