// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';
import MuiTypography from '@mui/material/Typography';

import { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { savePackageInfo } from '../../state/actions/resource-actions/save-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getManualAttributions } from '../../state/selectors/resource-selectors';
import { useAttributionIdsForReplacement } from '../../state/variables/use-attribution-ids-for-replacement';
import { maybePluralize } from '../../util/maybe-pluralize';
import { CardList } from '../CardList/CardList';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { PackageCard } from '../PackageCard/PackageCard';

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
      contentSx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
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
        <CardList
          data={attributionIdsForReplacement}
          data-testid={'removed-attributions'}
          renderItemContent={(attributionId, index) => {
            if (!attributionId || !(attributionId in attributions)) {
              return null;
            }

            return (
              <>
                <PackageCard packageInfo={attributions[attributionId]} />
                {index + 1 !== attributionIdsForReplacement.length && (
                  <MuiDivider />
                )}
              </>
            );
          }}
        />
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
          data={[selectedAttribution.id]}
          data-testid={'added attributions'}
          renderItemContent={() => (
            <PackageCard packageInfo={attributionWithoutCount} />
          )}
        />
      </>
    );
  }
};
