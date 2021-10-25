// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { PackageInfo } from '../../../shared/shared-types';
import { PackagePanelTitle, PopupType } from '../../enums/enums';
import {
  getExternalData,
  getManualData,
  getTemporaryPackageInfo,
  isAttributionBreakpoint,
} from '../../state/selectors/all-views-resource-selectors';
import { PanelPackage } from '../../types/types';
import { hasAttributionMultipleResources } from '../../util/has-attribution-multiple-resources';
import { AttributionColumn } from '../AttributionColumn/AttributionColumn';
import {
  getDisplayPackageInfo,
  setUpdateTemporaryPackageInfoForCreator,
} from './resource-details-attribution-column-helpers';
import {
  deleteAttributionAndSave,
  deleteAttributionGloballyAndSave,
  savePackageInfo,
  savePackageInfoIfSavingIsNotDisabled,
  unlinkAttributionAndSavePackageInfo,
} from '../../state/actions/resource-actions/save-actions';
import { setTemporaryPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import {
  getAttributionIdOfDisplayedPackageInManualPanel,
  getDisplayedPackage,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { openPopup } from '../../state/actions/view-actions/view-actions';

interface ResourceDetailsAttributionColumnProps {
  showParentAttributions: boolean;
}

export function ResourceDetailsAttributionColumn(
  props: ResourceDetailsAttributionColumnProps
): ReactElement | null {
  const manualData = useAppSelector(getManualData);
  const externalData = useAppSelector(getExternalData);
  const displayedPackage: PanelPackage | null =
    useAppSelector(getDisplayedPackage);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const attributionIdOfSelectedPackageInManualPanel: string | null =
    useAppSelector(getAttributionIdOfDisplayedPackageInManualPanel);
  const temporaryPackageInfo = useAppSelector(getTemporaryPackageInfo);
  const selectedResourceIsAttributionBreakpoint = useAppSelector(
    isAttributionBreakpoint(selectedResourceId)
  );

  const dispatch = useAppDispatch();

  function dispatchUnlinkAttributionAndSavePackageInfo(): void {
    if (attributionIdOfSelectedPackageInManualPanel) {
      dispatch(
        unlinkAttributionAndSavePackageInfo(
          selectedResourceId,
          attributionIdOfSelectedPackageInManualPanel,
          temporaryPackageInfo
        )
      );
    }
  }

  function dispatchSavePackageInfo(): void {
    dispatch(
      savePackageInfo(
        selectedResourceId,
        attributionIdOfSelectedPackageInManualPanel,
        temporaryPackageInfo
      )
    );
  }

  function openConfirmDeletionPopup(): void {
    if (displayPackageInfo.preSelected) {
      if (attributionIdOfSelectedPackageInManualPanel) {
        dispatch(
          deleteAttributionAndSave(
            selectedResourceId,
            attributionIdOfSelectedPackageInManualPanel
          )
        );
      }
    } else {
      dispatch(openPopup(PopupType.ConfirmDeletionPopup));
    }
  }

  function openConfirmDeletionGloballyPopup(): void {
    if (displayPackageInfo.preSelected) {
      if (attributionIdOfSelectedPackageInManualPanel) {
        dispatch(
          deleteAttributionGloballyAndSave(
            attributionIdOfSelectedPackageInManualPanel
          )
        );
      }
    } else {
      dispatch(openPopup(PopupType.ConfirmDeletionGloballyPopup));
    }
  }

  function saveFileRequestListener(): void {
    dispatch(
      savePackageInfoIfSavingIsNotDisabled(
        selectedResourceId,
        attributionIdOfSelectedPackageInManualPanel,
        temporaryPackageInfo
      )
    );
  }

  const displayPackageInfo: PackageInfo = getDisplayPackageInfo(
    displayedPackage,
    temporaryPackageInfo,
    manualData.attributions,
    externalData.attributions
  );

  const showSaveGloballyButton: boolean = hasAttributionMultipleResources(
    attributionIdOfSelectedPackageInManualPanel,
    manualData.attributionsToResources
  );

  const isShownDataEditable: boolean =
    displayedPackage?.panel === PackagePanelTitle.ManualPackages &&
    !props.showParentAttributions;

  function shownDataIsFromSignal(): boolean {
    const externalPackagePanels: Array<PackagePanelTitle> = [
      PackagePanelTitle.ExternalPackages,
      PackagePanelTitle.ContainedExternalPackages,
    ];

    return Boolean(
      displayedPackage && externalPackagePanels.includes(displayedPackage.panel)
    );
  }

  const showManualAttributionData: boolean =
    !shownDataIsFromSignal() || isShownDataEditable;
  const hideDeleteButtons =
    attributionIdOfSelectedPackageInManualPanel === '' ||
    props.showParentAttributions;

  const manualAttributionsOfBreakpointSelected =
    displayedPackage?.panel === PackagePanelTitle.ManualPackages &&
    selectedResourceIsAttributionBreakpoint;

  return selectedResourceId &&
    displayedPackage &&
    !manualAttributionsOfBreakpointSelected ? (
    <AttributionColumn
      isEditable={isShownDataEditable}
      resetViewIfThisIdChanges={selectedResourceId}
      showManualAttributionData={showManualAttributionData}
      areButtonsHidden={
        displayedPackage.panel !== PackagePanelTitle.ManualPackages
      }
      displayPackageInfo={displayPackageInfo}
      showParentAttributions={props.showParentAttributions}
      showSaveGloballyButton={showSaveGloballyButton}
      hideDeleteButtons={hideDeleteButtons}
      setUpdateTemporaryPackageInfoFor={setUpdateTemporaryPackageInfoForCreator(
        dispatch,
        temporaryPackageInfo
      )}
      onSaveButtonClick={
        showSaveGloballyButton
          ? dispatchUnlinkAttributionAndSavePackageInfo
          : dispatchSavePackageInfo
      }
      onSaveGloballyButtonClick={dispatchSavePackageInfo}
      setTemporaryPackageInfo={(packageInfo: PackageInfo): void => {
        dispatch(setTemporaryPackageInfo(packageInfo));
      }}
      saveFileRequestListener={saveFileRequestListener}
      onDeleteButtonClick={openConfirmDeletionPopup}
      onDeleteGloballyButtonClick={openConfirmDeletionGloballyPopup}
    />
  ) : null;
}
