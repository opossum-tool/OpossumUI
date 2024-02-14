// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTypography from '@mui/material/Typography';
import { compact, uniq } from 'lodash';

import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import {
  deleteAttributionAndSave,
  unlinkAttributionAndSave,
} from '../../state/actions/resource-actions/save-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getManualAttributions,
  getManualAttributionsToResources,
  getSelectedAttributionId,
  getSelectedResourceId,
} from '../../state/selectors/resource-selectors';
import { maybePluralize } from '../../util/maybe-pluralize';
import { List } from '../List/List';
import { LIST_CARD_HEIGHT } from '../ListCard/ListCard';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { PackageCard } from '../PackageCard/PackageCard';
import { LinkedResourcesTree } from '../ResourceBrowser/LinkedResourcesTree/LinkedResourcesTree';

const MAX_NUMBER_OF_CARDS = 4;

interface Props {
  attributionIdsToDelete: Array<string>;
  open: boolean;
  onClose: () => void;
}

export const ConfirmDeletionPopup: React.FC<Props> = ({
  attributionIdsToDelete,
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

  const resourceIds = uniq(
    compact(
      attributionIdsToDelete.flatMap((id) => attributionsToResources[id]),
    ),
  );
  const isOptionToDeleteOnSelectedResourceOnlyAvailable =
    resourceIds.length > 1 &&
    attributionIdsToDelete.every((id) =>
      attributionsToResources[id]?.includes(selectedResourceId),
    );

  const handleDelete = () => {
    attributionIdsToDelete.forEach((attributionId) => {
      dispatch(deleteAttributionAndSave(attributionId, selectedAttributionId));
    });
    onClose();
  };

  const handleDeleteOnResource = () => {
    attributionIdsToDelete.forEach((attributionId) => {
      dispatch(unlinkAttributionAndSave(selectedResourceId, attributionId));
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
      header={text.deleteAttributionsPopup.title}
      leftButtonConfig={{
        onClick: handleDelete,
        buttonText: isOptionToDeleteOnSelectedResourceOnlyAvailable
          ? text.deleteAttributionsPopup.deleteGlobally
          : text.deleteAttributionsPopup.delete,
        color: 'error',
      }}
      centerLeftButtonConfig={
        isOptionToDeleteOnSelectedResourceOnlyAvailable
          ? {
              onClick: handleDeleteOnResource,
              buttonText: text.deleteAttributionsPopup.deleteLocally,
              color: 'primary',
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
          {text.deleteAttributionsPopup.deleteAttributions(
            maybePluralize(
              attributionIdsToDelete.length,
              text.packageLists.attribution,
            ),
            maybePluralize(
              resourceIds.length,
              text.deleteAttributionsPopup.resource,
              { showOne: true },
            ),
          )}
        </MuiTypography>
        <List
          getListItem={(index) => {
            const attributionId = attributionIdsToDelete[index];

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
          length={attributionIdsToDelete.length}
          cardHeight={LIST_CARD_HEIGHT}
          maxNumberOfItems={MAX_NUMBER_OF_CARDS}
          minNumberOfItems={Math.min(
            MAX_NUMBER_OF_CARDS,
            attributionIdsToDelete.length,
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
          disableHighlightSelected={
            !isOptionToDeleteOnSelectedResourceOnlyAvailable
          }
          resourceIds={resourceIds}
          sx={{ minHeight: '100px' }}
        />
      </>
    );
  }
};
