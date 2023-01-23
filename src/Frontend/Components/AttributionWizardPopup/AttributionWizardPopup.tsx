// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useState } from 'react';
import MuiBox from '@mui/material/Box';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { ButtonText } from '../../enums/enums';
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { OpossumColors } from '../../shared-styles';
import { PathBar } from '../PathBar/PathBar';
import { AttributionWizardPackageStep } from '../AttributionWizardPackageStep/AttributionWizardPackageStep';
import { AttributionWizardVersionStep } from '../AttributionWizardVersionStep/AttributionWizardVersionStep';
import { ButtonConfig } from '../../types/types';
import {
  getExternalData,
  getManualAttributions,
  getManualData,
} from '../../state/selectors/all-views-resource-selectors';
import {
  getSelectedResourceId,
  getResolvedExternalAttributions,
} from '../../state/selectors/audit-view-resource-selectors';
import {
  getAttributionWizardPackageListsItems,
  getAttributionWizardPackageVersionListItems,
  getAllAttributionIdsWithCountsFromResourceAndChildren,
  getHighlightedPackageNameIds,
  getPreSelectedPackageAttributeIds,
  filterForPackageAttributeId,
  emptyAttribute,
} from './attribution-wizard-popup-helpers';
import { getPopupAttributionId } from '../../state/selectors/view-selector';
import { PackageInfo } from '../../../shared/shared-types';
import { setTemporaryPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';

const attributionWizardPopupHeader = 'Attribution Wizard';

const classes = {
  dialogHeader: {
    whiteSpace: 'nowrap',
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
    minHeight: '50vh',
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
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const externalData = useAppSelector(getExternalData);
  const manualData = useAppSelector(getManualData);

  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions
  );
  const popupAttributionId = useAppSelector(getPopupAttributionId);
  const manualAttributions = useAppSelector(getManualAttributions);

  const dispatch = useAppDispatch();
  function closeAttributionWizardPopup(): void {
    dispatch(closePopup());
  }

  const popupAttribution =
    popupAttributionId !== null ? manualAttributions[popupAttributionId] : {};
  const {
    preSelectedPackageNamespaceId,
    preSelectedPackageNameId,
    preSelectedPackageVersionId,
  } = getPreSelectedPackageAttributeIds(popupAttribution);

  const wizardStepIdsToDisplayValues: Array<[string, string]> = [
    ['packageNamespaceAndName', 'package'],
    ['packageVersion', 'version'],
  ];
  const wizardStepIds = wizardStepIdsToDisplayValues.map(
    (idAndDisplayValue) => idAndDisplayValue[0]
  );

  const [selectedPackageNamespaceId, setSelectedPackageNamespaceId] =
    useState<string>(preSelectedPackageNamespaceId);
  const [selectedPackageNameId, setSelectedPackageNameId] = useState<string>(
    preSelectedPackageNameId
  );
  const [selectedPackageVersionId, setSelectedPackageVersionId] =
    useState<string>(preSelectedPackageVersionId);
  const [selectedWizardStepId, setSelectedWizardStepId] = useState<string>(
    wizardStepIds[0]
  );

  const isPackageNamespaceAndNameSelected =
    selectedPackageNamespaceId !== '' && selectedPackageNameId !== '';
  const isPackageVersionSelected = selectedPackageVersionId !== '';

  const allAttributionIdsOfResourceAndChildrenWithCounts =
    getAllAttributionIdsWithCountsFromResourceAndChildren(
      selectedResourceId,
      externalData,
      manualData,
      resolvedExternalAttributions
    );

  const {
    attributedPackageNamespaces,
    attributedPackageNames,
    packageNamesToVersions,
  } = getAttributionWizardPackageListsItems(
    allAttributionIdsOfResourceAndChildrenWithCounts,
    {
      ...externalData.attributions,
      ...manualData.attributions,
    }
  );

  const selectedPackageNamespace = filterForPackageAttributeId(
    selectedPackageNamespaceId,
    attributedPackageNamespaces
  );

  const selectedPackageName = filterForPackageAttributeId(
    selectedPackageNameId,
    attributedPackageNames
  );

  const attributedPackageVersions =
    selectedPackageName !== ''
      ? getAttributionWizardPackageVersionListItems(
          selectedPackageName,
          packageNamesToVersions
        )
      : [];

  let selectedPackageVersion = '';
  if (selectedPackageVersionId !== '') {
    const attributedPackageVersion = attributedPackageVersions.filter(
      (item) => item.id === selectedPackageVersionId
    )[0];

    if (attributedPackageVersion === undefined) {
      setSelectedPackageVersionId('');
    } else {
      selectedPackageVersion = attributedPackageVersion.text;
    }
  }

  const highlightedPackageNameIds =
    selectedPackageName !== ''
      ? getHighlightedPackageNameIds(
          selectedPackageName,
          packageNamesToVersions
        )
      : [''];

  const selectedPackageInfo: PackageInfo = {
    packageType: popupAttribution.packageType ?? 'generic',
    packageName:
      selectedPackageName !== emptyAttribute ? selectedPackageName : undefined,
    packageNamespace:
      selectedPackageNamespace !== emptyAttribute
        ? selectedPackageNamespace
        : undefined,
    packageVersion:
      selectedPackageVersion !== emptyAttribute
        ? selectedPackageVersion
        : undefined,
  };

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

  function handleApplyClick(): void {
    dispatch(
      setTemporaryPackageInfo({
        ...popupAttribution,
        ...selectedPackageInfo,
      })
    );
    closeAttributionWizardPopup();
  }

  const nextButtonConfig: ButtonConfig = {
    buttonText: ButtonText.Next,
    onClick: handleNextClick,
    disabled: !isPackageNamespaceAndNameSelected,
    isDark: true,
    tooltipText: isPackageNamespaceAndNameSelected
      ? ''
      : 'Please select package namespace and name to continue',
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
  const applyButtonConfig: ButtonConfig = {
    buttonText: ButtonText.Apply,
    onClick: handleApplyClick,
    disabled: !isPackageVersionSelected,
    isDark: true,
    tooltipText: !isPackageVersionSelected
      ? 'Please select package version to apply changes'
      : '',
    tooltipPlacement: 'left',
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
                attributedPackageNamespaces={attributedPackageNamespaces}
                attributedPackageNames={attributedPackageNames}
                selectedPackageInfo={selectedPackageInfo}
                selectedPackageNamespaceId={selectedPackageNamespaceId}
                selectedPackageNameId={selectedPackageNameId}
                handlePackageNamespaceListItemClick={
                  handlePackageNamespaceListItemClick
                }
                handlePackageNameListItemClick={handlePackageNameListItemClick}
              />
            ) : selectedWizardStepId === wizardStepIds[1] ? (
              <AttributionWizardVersionStep
                attributedPackageVersions={attributedPackageVersions}
                selectedPackageInfo={selectedPackageInfo}
                highlightedPackageNameIds={highlightedPackageNameIds}
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
