// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { DisplayPackageInfo } from '../../../shared/shared-types';
import { PackagePanelTitle, PopupType } from '../../enums/enums';
import {
  getAttributionBreakpoints,
  getManualData,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/all-views-resource-selectors';
import { PanelPackage } from '../../types/types';
import { hasAttributionMultipleResources } from '../../util/has-attribution-multiple-resources';
import { AttributionColumn } from '../AttributionColumn/AttributionColumn';
import {
  deleteAttributionAndSave,
  deleteAttributionGloballyAndSave,
  savePackageInfo,
  savePackageInfoIfSavingIsNotDisabled,
  unlinkAttributionAndSavePackageInfo,
} from '../../state/actions/resource-actions/save-actions';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import {
  getAttributionIdOfDisplayedPackageInManualPanel,
  getDisplayedPackage,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { getAttributionBreakpointCheck } from '../../util/is-attribution-breakpoint';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { setUpdateTemporaryDisplayPackageInfoForCreator } from '../../util/set-update-temporary-package-info-for-creator';
import { convertDisplayPackageInfoToPackageInfo } from '../../util/convert-package-info';

interface ResourceDetailsAttributionColumnProps {
  showParentAttributions: boolean;
}

export function ResourceDetailsAttributionColumn(
  props: ResourceDetailsAttributionColumnProps
): ReactElement | null {
  const manualData = useAppSelector(getManualData);
  const displayedPackage: PanelPackage | null =
    useAppSelector(getDisplayedPackage);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const attributionIdOfSelectedPackageInManualPanel: string | null =
    useAppSelector(getAttributionIdOfDisplayedPackageInManualPanel);
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo
  );
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const selectedResourceIsAttributionBreakpoint = getAttributionBreakpointCheck(
    attributionBreakpoints
  )(selectedResourceId);
  const dispatch = useAppDispatch();

  function dispatchUnlinkAttributionAndSavePackageInfo(): void {
    if (attributionIdOfSelectedPackageInManualPanel) {
      dispatch(
        unlinkAttributionAndSavePackageInfo(
          selectedResourceId,
          attributionIdOfSelectedPackageInManualPanel,
          convertDisplayPackageInfoToPackageInfo(temporaryDisplayPackageInfo)
        )
      );
    }
  }

  function dispatchSavePackageInfo(): void {
    dispatch(
      savePackageInfo(
        selectedResourceId,
        attributionIdOfSelectedPackageInManualPanel,
        convertDisplayPackageInfoToPackageInfo(temporaryDisplayPackageInfo)
      )
    );
  }

  function openConfirmDeletionPopup(): void {
    if (!attributionIdOfSelectedPackageInManualPanel) return;
    if (temporaryDisplayPackageInfo.preSelected) {
      dispatch(
        deleteAttributionAndSave(
          selectedResourceId,
          attributionIdOfSelectedPackageInManualPanel
        )
      );
    } else {
      dispatch(
        openPopup(
          PopupType.ConfirmDeletionPopup,
          attributionIdOfSelectedPackageInManualPanel
        )
      );
    }
  }

  function openConfirmDeletionGloballyPopup(): void {
    if (!attributionIdOfSelectedPackageInManualPanel) return;

    if (temporaryDisplayPackageInfo.preSelected) {
      dispatch(
        deleteAttributionGloballyAndSave(
          attributionIdOfSelectedPackageInManualPanel
        )
      );
    } else {
      dispatch(
        openPopup(
          PopupType.ConfirmDeletionGloballyPopup,
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
        temporaryDisplayPackageInfo
      )
    );
  }

  const showSaveGloballyButton: boolean = hasAttributionMultipleResources(
    attributionIdOfSelectedPackageInManualPanel,
    manualData.attributionsToResources
  );

  const isShownDataEditable: boolean =
    displayedPackage?.panel === PackagePanelTitle.ManualPackages &&
    !props.showParentAttributions;

  function shownDataIsFromExternalAttribution(): boolean {
    const externalPackagePanels: Array<PackagePanelTitle> = [
      PackagePanelTitle.ExternalPackages,
      PackagePanelTitle.ContainedExternalPackages,
    ];

    return Boolean(
      displayedPackage && externalPackagePanels.includes(displayedPackage.panel)
    );
  }

  const showManualAttributionData: boolean =
    !shownDataIsFromExternalAttribution() || isShownDataEditable;
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
      showParentAttributions={props.showParentAttributions}
      showSaveGloballyButton={showSaveGloballyButton}
      hideDeleteButtons={hideDeleteButtons}
      setUpdateTemporaryDisplayPackageInfoFor={setUpdateTemporaryDisplayPackageInfoForCreator(
        dispatch,
        temporaryDisplayPackageInfo
      )}
      onSaveButtonClick={
        showSaveGloballyButton
          ? dispatchUnlinkAttributionAndSavePackageInfo
          : dispatchSavePackageInfo
      }
      onSaveGloballyButtonClick={dispatchSavePackageInfo}
      setTemporaryDisplayPackageInfo={(
        displayPackageInfo: DisplayPackageInfo
      ): void => {
        dispatch(setTemporaryDisplayPackageInfo(displayPackageInfo));
      }}
      saveFileRequestListener={saveFileRequestListener}
      onDeleteButtonClick={openConfirmDeletionPopup}
      onDeleteGloballyButtonClick={openConfirmDeletionGloballyPopup}
    />
  ) : null;
}
