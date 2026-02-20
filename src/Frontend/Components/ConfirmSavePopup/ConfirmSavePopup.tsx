// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';
import MuiTypography from '@mui/material/Typography';

import { text } from '../../../shared/text';
import {
  savePackageInfo,
  unlinkAttributionAndCreateNew,
} from '../../state/actions/resource-actions/save-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getManualAttributions,
  getSelectedAttributionId,
  getSelectedResourceId,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/resource-selectors';
import { backend } from '../../util/backendClient';
import { maybePluralize } from '../../util/maybe-pluralize';
import { CardList } from '../CardList/CardList';
import { PackageCard } from '../PackageCard/PackageCard';
import { LinkedResourcesTree } from '../ResourceBrowser/LinkedResourcesTree/LinkedResourcesTree';
import { useLinkedResourcesTreeState } from '../ResourceBrowser/LinkedResourcesTree/useLinkedResourcesTreeState';
import { StyledNotificationPopup } from './ConfirmSavePopup.style';

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
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );

  const linkedResourcesTreeState = useLinkedResourcesTreeState({
    onAttributionUuids: attributionIdsToSave,
    enabled: open,
  });

  const linkedResourceCount = linkedResourcesTreeState?.count;

  const isResourceLinkedOnAllAttributions =
    backend.isResourceLinkedOnAllAttributions.useQuery(
      {
        resourcePath: selectedResourceId,
        attributionUuids: attributionIdsToSave,
      },
      { enabled: !!selectedResourceId && attributionIdsToSave.length > 0 },
    );

  const hasMultipleResourcesWhichContainSelected =
    linkedResourceCount &&
    isResourceLinkedOnAllAttributions.data &&
    linkedResourceCount > 1 &&
    isResourceLinkedOnAllAttributions.data;
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
    <StyledNotificationPopup
      header={
        areAllAttributionsPreselected
          ? text.saveAttributionsPopup.titleConfirm
          : text.saveAttributionsPopup.titleSave
      }
      centerLeftButtonConfig={{
        onClick: handleSave,
        color: 'error',
        buttonText:
          linkedResourceCount && linkedResourceCount > 1
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
    >
      {renderContent()}
    </StyledNotificationPopup>
  );

  function renderContent() {
    return (
      <>
        <MuiTypography>
          {(areAllAttributionsPreselected
            ? text.saveAttributionsPopup.confirmAttributions
            : text.saveAttributionsPopup.saveAttributions)({
            attributions: maybePluralize(
              attributionIdsToSave.length,
              text.packageLists.attribution,
            ),
            resources: maybePluralize(
              linkedResourceCount ?? 1,
              text.saveAttributionsPopup.resource,
              { showOne: true },
            ),
          })}
        </MuiTypography>
        <CardList
          data={attributionIdsToSave
            .filter((id) => id in attributions)
            .map((id) => attributions[id])}
          renderItemContent={(attribution, { index }) => {
            return (
              <>
                <PackageCard packageInfo={attribution} />
                {index + 1 !== attributionIdsToSave.length && <MuiDivider />}
              </>
            );
          }}
        />
        <LinkedResourcesTree
          readOnly
          disableHighlightSelected={!hasMultipleResourcesWhichContainSelected}
          state={linkedResourcesTreeState}
          sx={{ minHeight: '100px' }}
        />
      </>
    );
  }
};
