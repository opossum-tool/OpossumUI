// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useState } from 'react';
import MuiBox from '@mui/material/Box';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { ButtonText } from '../../enums/enums';
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs';
import { useAppDispatch } from '../../state/hooks';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { OpossumColors } from '../../shared-styles';
import { PathBar } from '../PathBar/PathBar';
import { AttributionWizardPackageStep } from '../AttributionWizardPackageStep/AttributionWizardPackageStep';
import { AttributionWizardVersionStep } from '../AttributionWizardVersionStep/AttributionWizardVersionStep';
import { ButtonConfig } from '../../types/types';

// const POPUP_CONTENT_PADDING = 48; // TODO: monitored in upcoming tickets
const attributionWizardPopupHeader = 'Attribution Wizard';

const classes = {
  dialogHeader: {
    whiteSpace: 'nowrap',
    // width: `calc(100% - ${POPUP_CONTENT_PADDING}px)`, // TODO: monitored in upcoming tickets
  },
  pathFieldAndBreadcrumbsBox: {
    display: 'flex',
    gap: '30px',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainContentBox: {
    key: 'mainContent',
    display: 'flex',
    gap: '30px',
    width: 'fit-content',
    heigth: 'fit-content',
    marginTop: '12px',
    maxHeight: '70vh',
    minWidth: '60vw',
  },
  pathBar: {
    padding: '1px 5px',
  },
  pathBarBox: {
    padding: '4px',
    background: OpossumColors.lightBlue,
  },
};

export function AttributionWizardPopup(): ReactElement {
  const wizardStepIdsToDisplayValues: Array<[string, string]> = [
    ['packageNamespaceAndName', 'package'],
    ['packageVersion', 'version'],
  ];
  const wizardStepIds = wizardStepIdsToDisplayValues.map(
    (idAndDisplayValue) => idAndDisplayValue[0]
  );

  // TODO: streamline and integrate this logic later
  const [selectedPackageNamespaceId, setSelectedPackageNamespaceId] =
    useState<string>('');
  const [selectedPackageNameId, setSelectedPackageNameId] =
    useState<string>('');
  const [selectedPackageVersionId, setSelectedPackageVersionId] =
    useState<string>('');
  const [selectedWizardStepId, setSelectedWizardStepId] = useState<string>(
    wizardStepIds[0]
  );

  const packageNamespaceAndNameSelected: boolean =
    selectedPackageNamespaceId !== '' && selectedPackageNameId !== '';

  const dispatch = useAppDispatch();
  function closeAttributionWizardPopup(): void {
    dispatch(closePopup());
  }

  const handleBreadcrumbsClick = function (wizardStepId: string): void {
    setSelectedWizardStepId(wizardStepId);
  };

  function handleNextClick(): void {
    if (selectedWizardStepId !== wizardStepIds[wizardStepIds.length - 1]) {
      setSelectedWizardStepId(
        wizardStepIds[wizardStepIds.indexOf(selectedWizardStepId) + 1]
      );
    }
  }
  function handleBackClick(): void {
    if (selectedWizardStepId !== wizardStepIds[0]) {
      setSelectedWizardStepId(
        wizardStepIds[wizardStepIds.indexOf(selectedWizardStepId) - 1]
      );
    }
  }

  function handlePackageNamespaceListItemClick(id: string): void {
    setSelectedPackageNamespaceId(id);
  }
  function handlePackageNameListItemClick(id: string): void {
    setSelectedPackageNameId(id);
  }
  function handlePackageVersionListItemClick(id: string): void {
    setSelectedPackageVersionId(id);
  }

  const nextButtonConfig: ButtonConfig = {
    buttonText: ButtonText.Next,
    onClick: handleNextClick,
    disabled: !packageNamespaceAndNameSelected,
    isDark: true,
    tooltipText: !packageNamespaceAndNameSelected
      ? 'Please select package namespace and name to continue'
      : '',
    tooltipPlacement: 'left',
  };
  const backButtonConfig: ButtonConfig = {
    buttonText: ButtonText.Back,
    onClick: handleBackClick,
    disabled: false,
    isDark: false,
  };
  const cancelButtonConfig: ButtonConfig = {
    buttonText: ButtonText.Cancel,
    onClick: closeAttributionWizardPopup,
    disabled: false,
    isDark: false,
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
          : undefined
      }
      rightButtonConfig={cancelButtonConfig}
      onBackdropClick={closeAttributionWizardPopup}
      onEscapeKeyDown={closeAttributionWizardPopup}
      isOpen={true}
      fullWidth={false}
      headerSx={classes.dialogHeader}
      content={
        <>
          <MuiBox sx={classes.pathFieldAndBreadcrumbsBox}>
            <MuiBox sx={classes.pathBarBox}>
              <PathBar sx={classes.pathBar} />
            </MuiBox>
            <Breadcrumbs
              selectedId={selectedWizardStepId}
              onClick={handleBreadcrumbsClick}
              idsToDisplayValues={wizardStepIdsToDisplayValues}
            />
          </MuiBox>
          <MuiBox sx={classes.mainContentBox}>
            {selectedWizardStepId === wizardStepIds[0] ? (
              <AttributionWizardPackageStep
                selectedPackageNamespaceId={selectedPackageNamespaceId}
                selectedPackageNameId={selectedPackageNameId}
                handlePackageNamespaceListItemClick={
                  handlePackageNamespaceListItemClick
                }
                handlePackageNameListItemClick={handlePackageNameListItemClick}
              />
            ) : selectedWizardStepId === wizardStepIds[1] ? (
              <AttributionWizardVersionStep
                selectedPackageVersionId={selectedPackageVersionId}
                handlePackageVersionListItemClick={
                  handlePackageVersionListItemClick
                }
              />
            ) : null}
          </MuiBox>
        </>
      }
    />
  );
}
