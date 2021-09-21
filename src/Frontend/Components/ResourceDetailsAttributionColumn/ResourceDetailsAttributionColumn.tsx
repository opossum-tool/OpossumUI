// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PackageInfo } from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
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
  deleteAttributionForAllAndSave,
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

interface ResourceDetailsAttributionColumnProps {
  showParentAttributions: boolean;
}

export function ResourceDetailsAttributionColumn(
  props: ResourceDetailsAttributionColumnProps
): ReactElement | null {
  const manualData = useSelector(getManualData);
  const externalData = useSelector(getExternalData);
  const displayedPackage: PanelPackage | null =
    useSelector(getDisplayedPackage);
  const selectedResourceId = useSelector(getSelectedResourceId);
  const attributionIdOfSelectedPackageInManualPanel: string | null =
    useSelector(getAttributionIdOfDisplayedPackageInManualPanel);
  const temporaryPackageInfo = useSelector(getTemporaryPackageInfo);
  const selectedResourceIsAttributionBreakpoint = useSelector(
    isAttributionBreakpoint(selectedResourceId)
  );

  const dispatch = useDispatch();

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

  function deleteAttributionForAll(): void {
    if (attributionIdOfSelectedPackageInManualPanel) {
      dispatch(
        deleteAttributionForAllAndSave(
          attributionIdOfSelectedPackageInManualPanel
        )
      );
    }
  }

  function deleteAttributionForResource(): void {
    if (attributionIdOfSelectedPackageInManualPanel) {
      dispatch(
        deleteAttributionAndSave(
          selectedResourceId,
          attributionIdOfSelectedPackageInManualPanel
        )
      );
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

  const showSaveForAllButton: boolean = hasAttributionMultipleResources(
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
      showSaveForAllButton={showSaveForAllButton}
      hideDeleteButtons={hideDeleteButtons}
      setUpdateTemporaryPackageInfoFor={setUpdateTemporaryPackageInfoForCreator(
        dispatch,
        temporaryPackageInfo
      )}
      onSaveButtonClick={
        showSaveForAllButton
          ? dispatchUnlinkAttributionAndSavePackageInfo
          : dispatchSavePackageInfo
      }
      onSaveForAllButtonClick={dispatchSavePackageInfo}
      setTemporaryPackageInfo={(packageInfo: PackageInfo): void => {
        dispatch(setTemporaryPackageInfo(packageInfo));
      }}
      saveFileRequestListener={saveFileRequestListener}
      onDeleteButtonClick={deleteAttributionForResource}
      onDeleteForAllButtonClick={deleteAttributionForAll}
    />
  ) : null;
}
