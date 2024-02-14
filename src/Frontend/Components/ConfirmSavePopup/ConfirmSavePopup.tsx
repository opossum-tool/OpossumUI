// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTypography from '@mui/material/Typography';
import { compact, uniq } from 'lodash';

import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import {
  savePackageInfo,
  unlinkAttributionAndCreateNew,
} from '../../state/actions/resource-actions/save-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getManualAttributions,
  getManualAttributionsToResources,
  getSelectedAttributionId,
  getSelectedResourceId,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/resource-selectors';
import { maybePluralize } from '../../util/maybe-pluralize';
import { List } from '../List/List';
import { LIST_CARD_HEIGHT } from '../ListCard/ListCard';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { PackageCard } from '../PackageCard/PackageCard';
import { LinkedResourcesTree } from '../ResourceBrowser/LinkedResourcesTree/LinkedResourcesTree';

const MAX_NUMBER_OF_CARDS = 4;

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
  const attributions = useAppSelector(getManualAttributions);
  const attributionsToResources = useAppSelector(
    getManualAttributionsToResources,
  );
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );

  const resourceIds = uniq(
    compact(attributionIdsToSave.flatMap((id) => attributionsToResources[id])),
  );
  const hasMultipleResourcesWhichContainSelected =
    resourceIds.length > 1 && resourceIds.includes(selectedResourceId);
  const arePreselected = attributionIdsToSave.every(
    (id) => attributions[id]?.preSelected,
  );

  const handleSave = () => {
    attributionIdsToSave.forEach((attributionId) => {
      dispatch(
        savePackageInfo(
          null,
          attributionId,
          attributionId === selectedAttributionId
            ? temporaryDisplayPackageInfo
            : attributions[attributionId],
          attributionId !== selectedAttributionId,
        ),
      );
    });
    onClose();
  };

  const handleSaveOnResource = () => {
    attributionIdsToSave.forEach((attributionId) => {
      dispatch(
        unlinkAttributionAndCreateNew(
          selectedResourceId,
          attributionId === selectedAttributionId
            ? temporaryDisplayPackageInfo
            : attributions[attributionId],
        ),
      );
    });
    onClose();
  };

  return (
    <NotificationPopup
      content={renderContent()}
      contentSx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        height: '400px',
      }}
      header={
        arePreselected
          ? text.saveAttributionsPopup.titleConfirm
          : text.saveAttributionsPopup.titleSave
      }
      leftButtonConfig={{
        onClick: handleSave,
        buttonText: hasMultipleResourcesWhichContainSelected
          ? text.saveAttributionsPopup.updateGlobally
          : text.saveAttributionsPopup.update,
      }}
      centerLeftButtonConfig={
        hasMultipleResourcesWhichContainSelected
          ? {
              onClick: handleSaveOnResource,
              buttonText: text.saveAttributionsPopup.updateLocally,
              color: 'secondary',
            }
          : undefined
      }
      rightButtonConfig={{
        onClick: onClose,
        buttonText: text.buttons.cancel,
        color: 'secondary',
      }}
      isOpen={open}
      aria-label={'confirmation popup'}
      width={580}
    />
  );

  function renderContent() {
    return (
      <>
        <MuiTypography>
          {text.saveAttributionsPopup.updateAttributions(
            maybePluralize(
              attributionIdsToSave.length,
              text.packageLists.attribution,
            ),
            maybePluralize(
              resourceIds.length,
              text.saveAttributionsPopup.resource,
              { showOne: true },
            ),
          )}
        </MuiTypography>
        <List
          getListItem={(index) => {
            const attributionId = attributionIdsToSave[index];

            if (!attributionId || !(attributionId in attributions)) {
              return null;
            }

            const attribution = attributions[attributionId];

            return (
              <PackageCard
                cardConfig={{
                  isPreSelected: attribution.preSelected,
                }}
                packageInfo={attribution}
              />
            );
          }}
          length={attributionIdsToSave.length}
          cardHeight={LIST_CARD_HEIGHT}
          maxNumberOfItems={MAX_NUMBER_OF_CARDS}
          minNumberOfItems={Math.min(
            MAX_NUMBER_OF_CARDS,
            attributionIdsToSave.length,
          )}
          divider
          sx={{
            background: OpossumColors.lightestBlue,
            border: '1px solid rgba(0, 0, 0, 0.12)',
            borderBottom: 'none',
            height: 'fit-content',
          }}
        />
        <LinkedResourcesTree
          readOnly
          disableHighlightSelected={!hasMultipleResourcesWhichContainSelected}
          resourceIds={resourceIds}
          sx={{ minHeight: '100px' }}
        />
      </>
    );
  }
};
