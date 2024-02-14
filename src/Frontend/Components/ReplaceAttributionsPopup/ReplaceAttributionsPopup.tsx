// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';

import { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { savePackageInfo } from '../../state/actions/resource-actions/save-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getManualAttributions } from '../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../state/variables/use-attribution-ids-for-replacement';
import { maybePluralize } from '../../util/maybe-pluralize';
import { List } from '../List/List';
import { LIST_CARD_HEIGHT } from '../ListCard/ListCard';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { PackageCard } from '../PackageCard/PackageCard';
import { ContentContainer } from './ReplaceAttributionsPopup.style';

const MAX_NUMBER_OF_CARDS = 4;

interface Props {
  selectedAttribution: PackageInfo;
  open: boolean;
  onClose: () => void;
}

export const ReplaceAttributionsPopup = ({
  selectedAttribution,
  onClose,
  open,
}: Props) => {
  const dispatch = useAppDispatch();
  const attributions = useAppSelector(getManualAttributions);

  const [attributionIdsForReplacement, setAttributionIdsForReplacement] =
    useAttributionIdsForReplacement();

  const handleReplace = () => {
    setAttributionIdsForReplacement([]);
    onClose();
    dispatch(changeSelectedAttributionOrOpenUnsavedPopup(selectedAttribution));
    if (selectedAttribution.preSelected) {
      dispatch(
        savePackageInfo(null, selectedAttribution.id, selectedAttribution),
      );
    }
    attributionIdsForReplacement.forEach((attributionId) => {
      dispatch(
        savePackageInfo(
          null,
          attributionId,
          selectedAttribution,
          attributionId !== selectedAttribution.id,
        ),
      );
    });
  };

  return (
    <NotificationPopup
      content={renderContent()}
      header={text.replaceAttributionsPopup.title}
      leftButtonConfig={{
        onClick: handleReplace,
        buttonText: text.replaceAttributionsPopup.replace,
        color: 'error',
      }}
      rightButtonConfig={{
        onClick: () => onClose(),
        buttonText: text.buttons.cancel,
        color: 'secondary',
      }}
      isOpen={open}
      aria-label={'replace attributions popup'}
      width={500}
    />
  );

  function renderContent() {
    return (
      <ContentContainer>
        {renderAttributionsToRemove()}
        {renderAttributionToAdd()}
      </ContentContainer>
    );
  }

  function renderAttributionsToRemove() {
    return (
      <MuiBox data-testid={'removed-attributions'}>
        <MuiTypography paragraph>
          {text.replaceAttributionsPopup.removeAttributions(
            maybePluralize(
              attributionIdsForReplacement.length,
              text.packageLists.attribution,
            ),
          )}
        </MuiTypography>
        <List
          getListItem={(index) => {
            const attributionId = attributionIdsForReplacement[index];
            const attribution = attributions[attributionId];

            if (!attribution) {
              return null;
            }

            return (
              <PackageCard
                cardConfig={{
                  isPreSelected: attribution.preSelected,
                }}
                packageInfo={attribution}
              />
            );
          }}
          length={attributionIdsForReplacement.length}
          cardHeight={LIST_CARD_HEIGHT}
          maxNumberOfItems={MAX_NUMBER_OF_CARDS}
          minNumberOfItems={Math.min(
            attributionIdsForReplacement.length,
            MAX_NUMBER_OF_CARDS,
          )}
          divider
          sx={{
            background: OpossumColors.lightestBlue,
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderBottom: 'none',
          }}
        />
      </MuiBox>
    );
  }

  function renderAttributionToAdd() {
    return (
      <MuiBox data-testid={'added-attributions'}>
        <MuiTypography paragraph>
          {text.replaceAttributionsPopup.replacement}
        </MuiTypography>
        <PackageCard
          cardConfig={{
            isPreSelected: selectedAttribution.preSelected,
            hideCount: true,
            isSelected: true,
          }}
          packageInfo={selectedAttribution}
        />
      </MuiBox>
    );
  }
};
