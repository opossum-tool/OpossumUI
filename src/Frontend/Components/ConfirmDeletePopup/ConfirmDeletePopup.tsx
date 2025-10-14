// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';
import MuiTypography from '@mui/material/Typography';
import { compact, uniq } from 'lodash';

import { text } from '../../../shared/text';
import {
  deleteAttributionsAndSave,
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
import { PackageCard } from '../PackageCard/PackageCard';
import { LinkedResourcesTree } from '../ResourceBrowser/LinkedResourcesTree/LinkedResourcesTree';
import { StyledNotificationPopup } from './ConfirmDeletePopup.style';

interface Props {
  attributionIdsToDelete: Array<string>;
  open: boolean;
  onClose: () => void;
}

export const ConfirmDeletePopup: React.FC<Props> = ({
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
    dispatch(
      deleteAttributionsAndSave(attributionIdsToDelete, selectedAttributionId),
    );
    onClose();
  };

  const handleDeleteOnResource = () => {
    dispatch(
      unlinkAttributionAndSave(selectedResourceId, attributionIdsToDelete),
    );
    onClose();
  };

  return (
    <StyledNotificationPopup
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
      aria-label={'confirm delete popup'}
      width={580}
    >
      {renderContent()}
    </StyledNotificationPopup>
  );

  function renderContent() {
    return (
      <>
        <MuiTypography>
          {text.deleteAttributionsPopup.deleteAttributions({
            attributions: maybePluralize(
              attributionIdsToDelete.length,
              text.packageLists.attribution,
            ),
            resources: maybePluralize(
              resourceIds.length,
              text.deleteAttributionsPopup.resource,
              { showOne: true },
            ),
          })}
        </MuiTypography>
        <CardList
          data={attributionIdsToDelete.filter((id) => id in attributions)}
          renderItemContent={(attributionId, { index }) => {
            if (!attributions[attributionId]) {
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
