// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiNavigateNextIcon from '@mui/icons-material/NavigateNext';
import MuiBox from '@mui/material/Box';
import MuiTooltip from '@mui/material/Tooltip';
import MuiTypography from '@mui/material/Typography';
import { ReactElement, useState } from 'react';
import { v4 as uuid4 } from 'uuid';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { ButtonText } from '../../enums/enums';
import { OpossumColors, tooltipStyle } from '../../shared-styles';
import { closeAttributionWizardPopup } from '../../state/actions/popup-actions/popup-actions';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import {
  setAttributionWizardPackageNames,
  setAttributionWizardPackageNamespaces,
  setAttributionWizardPackageVersions,
  setAttributionWizardSelectedPackageIds,
} from '../../state/actions/resource-actions/attribution-wizard-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getFilesWithChildren } from '../../state/selectors/all-views-resource-selectors';
import {
  getAttributionWizardPackageNames,
  getAttributionWizardPackageNamespaces,
  getAttributionWizardPackageVersions,
  getAttributionWizardSelectedPackageAttributeIds,
  getAttributionWizardTotalAttributionCount,
  getAttributionWizarOriginalDisplayPackageInfo,
} from '../../state/selectors/attribution-wizard-selectors';
import { getSelectedResourceId } from '../../state/selectors/audit-view-resource-selectors';
import { getFileWithChildrenCheck } from '../../util/is-file-with-children';
import { removeTrailingSlashIfFileWithChildren } from '../../util/remove-trailing-slash-if-file-with-children';
import { AttributionWizardPackageStep } from '../AttributionWizardPackageStep/AttributionWizardPackageStep';
import { AttributionWizardVersionStep } from '../AttributionWizardVersionStep/AttributionWizardVersionStep';
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs';
import { ButtonProps } from '../Button/Button';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import {
  getAttributionWizardListItems,
  getSelectedPackageAttributes,
} from './attribution-wizard-popup-helpers';

const MAXIMUM_NUMBER_OF_TABLES_IN_SINGLE_STEP = 2;
const TABLE_WIDTH = 250;
const GAP_BETWEEN_TABLES = 20;
const PATH_BAR_TOTAL_HEIGHT = 62;
const BREADCRUMBS_TOTAL_HEIGHT = 42;
const attributionWizardPopupHeader = 'Attribution Wizard';

const MAIN_CONTENT_WIDTH =
  MAXIMUM_NUMBER_OF_TABLES_IN_SINGLE_STEP * TABLE_WIDTH +
  (MAXIMUM_NUMBER_OF_TABLES_IN_SINGLE_STEP - 1) * GAP_BETWEEN_TABLES;

const classes = {
  dialogContent: {
    backgroundColor: OpossumColors.lightestBlue,
    height: '75vh',
    margin: '0px 24px 12px 24px',
  },
  mainContentBox: {
    width: `${MAIN_CONTENT_WIDTH}px`,
    marginTop: '15px',
    height: `calc(100% - ${PATH_BAR_TOTAL_HEIGHT}px - ${BREADCRUMBS_TOTAL_HEIGHT}px)`,
  },
  breadcrumbs: {
    height: `calc(${BREADCRUMBS_TOTAL_HEIGHT}px - 20px)`,
    marginBottom: '20px',
  },
  listBox: {
    gap: `${GAP_BETWEEN_TABLES}px`,
  },
  list: {
    width: `${TABLE_WIDTH}px`,
  },
  pathBar: {
    margin: '24px 0px 12px 0px',
    padding: '1px 0px 1px 5px',
    height: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: OpossumColors.white,
  },
  leftEllipsis: {
    textOverflow: 'ellipsis',
    overflowX: 'hidden',
    whiteSpace: 'nowrap',
    direction: 'rtl',
  },
  tooltip: tooltipStyle,
};

export function AttributionWizardPopup(): ReactElement {
  const originalDisplayPackageInfo = useAppSelector(
    getAttributionWizarOriginalDisplayPackageInfo,
  );
  const packageNamespaces = useAppSelector(
    getAttributionWizardPackageNamespaces,
  );
  const packageNames = useAppSelector(getAttributionWizardPackageNames);
  const packageVersions = useAppSelector(getAttributionWizardPackageVersions);
  const selectedPackageAttributeIds = useAppSelector(
    getAttributionWizardSelectedPackageAttributeIds,
  );
  const totalAttributionCount = useAppSelector(
    getAttributionWizardTotalAttributionCount,
  );
  const path = useAppSelector(getSelectedResourceId);
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const isFileWithChildren = getFileWithChildrenCheck(filesWithChildren);

  const {
    selectedPackageNamespace,
    selectedPackageName,
    selectedPackageVersion,
  } = getSelectedPackageAttributes(
    packageNamespaces,
    packageNames,
    packageVersions,
    selectedPackageAttributeIds,
  );

  const selectedPackageNameIsValid = selectedPackageName !== '';

  const dispatch = useAppDispatch();
  function closeAttributionWizardPopupHandler(): void {
    dispatch(closeAttributionWizardPopup());
  }

  const wizardStepIdsToDisplayValues: Array<[string, string]> = [
    ['packageNamespaceAndName', 'package'],
    ['packageVersion', 'version'],
  ];
  const wizardStepIds = wizardStepIdsToDisplayValues.map(
    (idAndDisplayValue) => idAndDisplayValue[0],
  );

  const [selectedWizardStepId, setSelectedWizardStepId] = useState<string>(
    wizardStepIds[0],
  );

  const {
    attributedPackageNamespacesWithManuallyAddedOnes,
    attributedPackageNamesWithManuallyAddedOnes,
    attributedPackageVersionsWithManuallyAddedOnes,
  } = getAttributionWizardListItems(
    packageNamespaces,
    packageNames,
    packageVersions,
    totalAttributionCount || 1,
  );

  const selectedDisplayPackageInfo: DisplayPackageInfo = {
    packageType: originalDisplayPackageInfo.packageType ?? 'generic',
    packageName: selectedPackageName ? selectedPackageName : undefined,
    packageNamespace: selectedPackageNamespace
      ? selectedPackageNamespace
      : undefined,
    packageVersion: selectedPackageVersion ? selectedPackageVersion : undefined,
    attributionIds: [],
  };

  function addNewPackageNamespace(newNamespace: string): void {
    dispatch(
      setAttributionWizardPackageNamespaces({
        [uuid4()]: { text: newNamespace, manuallyAdded: true },
        ...packageNamespaces,
      }),
    );
  }

  function addNewPackageName(newName: string): void {
    dispatch(
      setAttributionWizardPackageNames({
        [uuid4()]: { text: newName, manuallyAdded: true },
        ...packageNames,
      }),
    );
  }

  function addNewPackageVersion(newVersion: string): void {
    dispatch(
      setAttributionWizardPackageVersions({
        [uuid4()]: { text: newVersion, manuallyAdded: true },
        ...packageVersions,
      }),
    );
  }
  const handleBreadcrumbsClick = function (wizardStepId: string): void {
    setSelectedWizardStepId(wizardStepId);
  };
  function handleNextClick(): void {
    if (selectedWizardStepId !== wizardStepIds[wizardStepIds.length - 1]) {
      setSelectedWizardStepId(
        wizardStepIds[wizardStepIds.indexOf(selectedWizardStepId) + 1],
      );
    }
  }
  function handleBackClick(): void {
    if (selectedWizardStepId !== wizardStepIds[0]) {
      setSelectedWizardStepId(
        wizardStepIds[wizardStepIds.indexOf(selectedWizardStepId) - 1],
      );
    }
  }
  function handlePackageNamespaceListItemClick(id: string): void {
    dispatch(
      setAttributionWizardSelectedPackageIds({
        ...selectedPackageAttributeIds,
        namespaceId: id,
      }),
    );
  }
  function handlePackageNameListItemClick(id: string): void {
    dispatch(
      setAttributionWizardSelectedPackageIds({
        ...selectedPackageAttributeIds,
        nameId: id,
      }),
    );
  }
  function handlePackageVersionListItemClick(id: string): void {
    dispatch(
      setAttributionWizardSelectedPackageIds({
        ...selectedPackageAttributeIds,
        versionId: id,
      }),
    );
  }
  function handleApplyClick(): void {
    dispatch(
      setTemporaryDisplayPackageInfo({
        ...originalDisplayPackageInfo,
        ...selectedDisplayPackageInfo,
      }),
    );
    closeAttributionWizardPopupHandler();
  }

  const nextButtonConfig: ButtonProps = {
    buttonText: ButtonText.Next,
    onClick: handleNextClick,
    disabled: !selectedPackageNameIsValid,
    tooltipText: !selectedPackageNameIsValid
      ? 'Please select a valid package name to continue'
      : '',
    tooltipPlacement: 'top',
  };
  const backButtonConfig: ButtonProps = {
    buttonText: ButtonText.Back,
    onClick: handleBackClick,
    disabled: false,
    color: 'secondary',
  };
  const cancelButtonConfig: ButtonProps = {
    buttonText: ButtonText.Cancel,
    onClick: closeAttributionWizardPopupHandler,
    disabled: false,
    color: 'secondary',
  };
  const applyButtonConfig: ButtonProps = {
    buttonText: ButtonText.Apply,
    onClick: handleApplyClick,
  };

  return (
    <NotificationPopup
      header={attributionWizardPopupHeader}
      centerLeftButtonConfig={
        selectedWizardStepId !== wizardStepIds[0] ? backButtonConfig : undefined
      }
      centerRightButtonConfig={
        selectedWizardStepId !== wizardStepIds[wizardStepIds.length - 1]
          ? nextButtonConfig
          : applyButtonConfig
      }
      rightButtonConfig={cancelButtonConfig}
      onBackdropClick={closeAttributionWizardPopupHandler}
      onEscapeKeyDown={closeAttributionWizardPopupHandler}
      isOpen={true}
      fullWidth={false}
      contentSx={classes.dialogContent}
      content={
        <>
          <MuiBox sx={classes.pathBar}>
            <MuiTooltip sx={classes.tooltip} title={path}>
              <MuiTypography sx={classes.leftEllipsis} variant={'subtitle1'}>
                <bdi>
                  {removeTrailingSlashIfFileWithChildren(
                    path,
                    isFileWithChildren,
                  )}
                </bdi>
              </MuiTypography>
            </MuiTooltip>
          </MuiBox>
          <Breadcrumbs
            selectedId={selectedWizardStepId}
            onClick={handleBreadcrumbsClick}
            idsToDisplayValues={wizardStepIdsToDisplayValues}
            separator={<MuiNavigateNextIcon fontSize="inherit" />}
            sx={classes.breadcrumbs}
          />
          <MuiBox sx={classes.mainContentBox}>
            {selectedWizardStepId === wizardStepIds[0] ? (
              <AttributionWizardPackageStep
                attributedPackageNamespaces={
                  attributedPackageNamespacesWithManuallyAddedOnes
                }
                attributedPackageNames={
                  attributedPackageNamesWithManuallyAddedOnes
                }
                selectedDisplayPackageInfo={selectedDisplayPackageInfo}
                selectedPackageNamespaceId={
                  selectedPackageAttributeIds.namespaceId
                }
                selectedPackageNameId={selectedPackageAttributeIds.nameId}
                handlePackageNamespaceListItemClick={
                  handlePackageNamespaceListItemClick
                }
                handlePackageNameListItemClick={handlePackageNameListItemClick}
                addPackageNamespace={addNewPackageNamespace}
                addPackageName={addNewPackageName}
                listBoxSx={classes.listBox}
                listSx={classes.list}
              />
            ) : selectedWizardStepId === wizardStepIds[1] ? (
              <AttributionWizardVersionStep
                attributedPackageVersions={
                  attributedPackageVersionsWithManuallyAddedOnes
                }
                selectedDisplayPackageInfo={selectedDisplayPackageInfo}
                highlightedPackageNameId={selectedPackageAttributeIds.nameId}
                selectedPackageVersionId={selectedPackageAttributeIds.versionId}
                handlePackageVersionListItemClick={
                  handlePackageVersionListItemClick
                }
                addNewPackageVersion={addNewPackageVersion}
                listSx={classes.list}
              />
            ) : null}
          </MuiBox>
        </>
      }
    />
  );
}
