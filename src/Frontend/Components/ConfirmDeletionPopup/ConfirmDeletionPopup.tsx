// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';
import MuiTypography from '@mui/material/Typography';
import { compact, uniq } from 'lodash';

import { text } from '../../../shared/text';
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
import { CardList } from '../CardList/CardList';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { PackageCard } from '../PackageCard/PackageCard';
import { LinkedResourcesTree } from '../ResourceBrowser/LinkedResourcesTree/LinkedResourcesTree';

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
    dispatch(
      unlinkAttributionAndSave(selectedResourceId, attributionIdsToDelete),
    );
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
      centerLeftButtonConfig={{
        onClick: handleDelete,
        buttonText:
          resourceIds.length > 1
            ? text.deleteAttributionsPopup.deleteGlobally
            : text.deleteAttributionsPopup.delete,
        color: 'error',
      }}
      leftButtonConfig={
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
      aria-label={'confirm deletion popup'}
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
        <CardList
          data={attributionIdsToDelete}
          renderItemContent={(attributionId, index) => {
            if (!attributionId || !(attributionId in attributions)) {
              return null;
            }

            return (
              <>
                <PackageCard packageInfo={attributions[attributionId]} />
                {index + 1 !== attributionIdsToDelete.length && <MuiDivider />}
              </>
            );
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
