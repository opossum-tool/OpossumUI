// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';
import MuiTypography from '@mui/material/Typography';
import { compact, uniq } from 'lodash';

import { text } from '../../../shared/text';
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
import { CardList } from '../CardList/CardList';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { PackageCard } from '../PackageCard/PackageCard';
import { LinkedResourcesTree } from '../ResourceBrowser/LinkedResourcesTree/LinkedResourcesTree';

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
  const areAllAttributionsPreselected = attributionIdsToSave.every(
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
        areAllAttributionsPreselected
          ? text.saveAttributionsPopup.titleConfirm
          : text.saveAttributionsPopup.titleSave
      }
      centerLeftButtonConfig={{
        onClick: handleSave,
        color: 'error',
        buttonText:
          resourceIds.length > 1
            ? areAllAttributionsPreselected
              ? text.saveAttributionsPopup.confirmGlobally
              : text.saveAttributionsPopup.saveGlobally
            : areAllAttributionsPreselected
              ? text.saveAttributionsPopup.confirm
              : text.saveAttributionsPopup.save,
      }}
      leftButtonConfig={
        hasMultipleResourcesWhichContainSelected
          ? {
              onClick: handleSaveOnResource,
              buttonText: areAllAttributionsPreselected
                ? text.saveAttributionsPopup.confirmLocally
                : text.saveAttributionsPopup.saveLocally,
            }
          : undefined
      }
      rightButtonConfig={{
        onClick: onClose,
        buttonText: text.buttons.cancel,
        color: 'secondary',
      }}
      isOpen={open}
      aria-label={'confirm save popup'}
      width={580}
    />
  );

  function renderContent() {
    return (
      <>
        <MuiTypography>
          {(areAllAttributionsPreselected
            ? text.saveAttributionsPopup.confirmAttributions
            : text.saveAttributionsPopup.saveAttributions)(
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
        <CardList
          data={attributionIdsToSave}
          renderItemContent={(attributionId, index) => {
            if (!attributionId || !(attributionId in attributions)) {
              return null;
            }

            return (
              <>
                <PackageCard packageInfo={attributions[attributionId]} />
                {index + 1 !== attributionIdsToSave.length && <MuiDivider />}
              </>
            );
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
