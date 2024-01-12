// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { compact } from 'lodash';

import { text } from '../../../shared/text';
import { deleteAttributionGloballyAndSave } from '../../state/actions/resource-actions/save-actions';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getCurrentAttributionId,
  getManualAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import { getMultiSelectSelectedAttributionIds } from '../../state/selectors/attribution-view-resource-selectors';
import { convertPackageInfoToDisplayPackageInfo } from '../../util/convert-package-info';
import { maybePluralize } from '../../util/maybe-pluralize';
import { List } from '../List/List';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { PACKAGE_CARD_HEIGHT, PackageCard } from '../PackageCard/PackageCard';

export function ConfirmMultiSelectDeletionPopup() {
  const dispatch = useAppDispatch();
  const attributions = useAppSelector(getManualAttributions);
  const multiSelectSelectedAttributionIds = useAppSelector(
    getMultiSelectSelectedAttributionIds,
  );
  const selectedAttributionId =
    useAppSelector(getCurrentAttributionId) ?? undefined;
  const idsToDelete = compact(
    multiSelectSelectedAttributionIds.length
      ? multiSelectSelectedAttributionIds
      : [selectedAttributionId],
  );

  return (
    <NotificationPopup
      content={renderContent()}
      header={text.deleteAttributionsPopup.title}
      leftButtonConfig={{
        onClick: () => {
          idsToDelete.forEach((attributionId) => {
            dispatch(
              deleteAttributionGloballyAndSave(
                attributionId,
                selectedAttributionId,
              ),
            );
          });
          dispatch(closePopup());
        },
        buttonText: text.buttons.confirm,
      }}
      rightButtonConfig={{
        onClick: () => dispatch(closePopup()),
        buttonText: text.buttons.cancel,
        color: 'secondary',
      }}
      isOpen
      aria-label={'confirmation popup'}
      width={500}
    />
  );

  function renderContent() {
    return (
      <MuiBox>
        <MuiTypography paragraph>
          {text.deleteAttributionsPopup.deleteAttributions(
            maybePluralize(
              idsToDelete.length,
              text.attributionList.attribution,
            ),
          )}
        </MuiTypography>
        <List
          getListItem={(index) => {
            const attributionId = idsToDelete[index];
            const attribution = attributions[attributionId];

            if (!attribution) {
              return null;
            }

            return (
              <PackageCard
                cardId={attributionId}
                cardConfig={{
                  isPreSelected: attribution.preSelected,
                }}
                displayPackageInfo={convertPackageInfoToDisplayPackageInfo(
                  attribution,
                  [],
                )}
              />
            );
          }}
          length={idsToDelete.length}
          cardHeight={PACKAGE_CARD_HEIGHT}
          maxNumberOfItems={10}
        />
      </MuiBox>
    );
  }
}
