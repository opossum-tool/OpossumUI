// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';
import MuiTypography from '@mui/material/Typography';

import { text } from '../../../shared/text';
import { useAppSelector } from '../../state/hooks';
import {
  getSelectedAttributionId,
  getSelectedResourceId,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/resource-selectors';
import {
  saveAttribution,
  unlinkAndCreateAttribution,
} from '../../util/attribution-actions';
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
  const selectedAttributionId = useAppSelector(getSelectedAttributionId);
  const selectedResourceId = useAppSelector(getSelectedResourceId);

  const { data: attributionsToSave } = backend.listAttributions.useQuery(
    {
      resourcePathForRelationships: selectedResourceId,
      uuids: attributionIdsToSave,
    },
    {
      enabled: open,
    },
  );

  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );

  const linkedResourcesTreeState = useLinkedResourcesTreeState({
    onAttributionUuids: attributionIdsToSave,
    enabled: open,
  });

  const linkedResourceCount = linkedResourcesTreeState?.count;

  const isResourceLinkedOnAllAttributions = attributionsToSave
    ? Object.values(attributionsToSave).every((a) => a.relation === 'resource')
    : undefined;

  const hasMultipleResourcesWhichContainSelected =
    linkedResourceCount &&
    linkedResourceCount > 1 &&
    isResourceLinkedOnAllAttributions;

  const areAllAttributionsPreselected = attributionsToSave
    ? Object.values(attributionsToSave).every((a) => a.preSelected)
    : undefined;

  const handleSave = () => {
    attributionsToSave &&
      Object.entries(attributionsToSave).forEach(
        async ([attributionId, attributionData]) => {
          await saveAttribution(
            attributionId,
            attributionId === selectedAttributionId
              ? temporaryDisplayPackageInfo
              : attributionData,
          );
        },
      );

    onClose();
  };

  const handleSaveOnResource = () => {
    attributionsToSave &&
      Object.entries(attributionsToSave).forEach(
        async ([attributionId, attributionData]) => {
          await unlinkAndCreateAttribution(
            selectedResourceId,
            attributionId === selectedAttributionId
              ? temporaryDisplayPackageInfo
              : attributionData,
          );
        },
      );
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
        {attributionsToSave ? (
          <CardList
            data={Object.values(attributionsToSave)}
            renderItemContent={(attribution, { index }) => {
              return (
                <>
                  <PackageCard packageInfo={attribution} />
                  {index + 1 !== attributionIdsToSave.length && <MuiDivider />}
                </>
              );
            }}
          />
        ) : (
          <MuiTypography>{text.updateAppPopup.loading}</MuiTypography>
        )}
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
