// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement } from 'react';

import { PackagePanelTitle, PopupType } from '../../enums/enums';
import {
  deleteAttributionAndSave,
  deleteAttributionGloballyAndSave,
  savePackageInfo,
  savePackageInfoIfSavingIsNotDisabled,
  unlinkAttributionAndSavePackageInfo,
  unlinkAttributionAndSavePackageInfoIfSavingIsNotDisabled,
} from '../../state/actions/resource-actions/save-actions';
import { openPopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getAttributionBreakpoints,
  getAttributionIdOfDisplayedPackageInManualPanel,
  getDisplayedPackage,
  getIsGlobalSavingDisabled,
  getManualData,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/all-views-resource-selectors';
import {
  getDidPreferredFieldChange,
  getSelectedResourceId,
} from '../../state/selectors/audit-view-resource-selectors';
import { PanelPackage } from '../../types/types';
import { convertDisplayPackageInfoToPackageInfo } from '../../util/convert-package-info';
import { hasAttributionMultipleResources } from '../../util/has-attribution-multiple-resources';
import { getAttributionBreakpointCheck } from '../../util/is-attribution-breakpoint';
import { AttributionColumn } from '../AttributionColumn/AttributionColumn';

interface ResourceDetailsAttributionColumnProps {
  showParentAttributions: boolean;
}

export function ResourceDetailsAttributionColumn(
  props: ResourceDetailsAttributionColumnProps,
): ReactElement | null {
  const manualData = useAppSelector(getManualData);
  const displayedPackage: PanelPackage | null =
    useAppSelector(getDisplayedPackage);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const attributionIdOfSelectedPackageInManualPanel: string | null =
    useAppSelector(getAttributionIdOfDisplayedPackageInManualPanel);
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );
  const isGlobalSavingDisabled = useAppSelector(getIsGlobalSavingDisabled);
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const selectedResourceIsAttributionBreakpoint = getAttributionBreakpointCheck(
    attributionBreakpoints,
  )(selectedResourceId);
  const didPreferredFieldChange = useAppSelector(getDidPreferredFieldChange);
  const dispatch = useAppDispatch();

  function dispatchUnlinkAttributionAndSavePackageInfoOrOpenWasPreferredPopup(): void {
    if (temporaryDisplayPackageInfo.wasPreferred) {
      dispatch(openPopup(PopupType.ModifyWasPreferredAttributionPopup));
    } else if (attributionIdOfSelectedPackageInManualPanel) {
      dispatch(
        unlinkAttributionAndSavePackageInfo(
          selectedResourceId,
          attributionIdOfSelectedPackageInManualPanel,
          convertDisplayPackageInfoToPackageInfo(temporaryDisplayPackageInfo),
        ),
      );
    }
  }

  function dispatchSavePackageInfoOrOpenPreferGloballyOrWasPreferredPopup(): void {
    if (temporaryDisplayPackageInfo.wasPreferred) {
      dispatch(openPopup(PopupType.ModifyWasPreferredAttributionPopup));
    } else if (showSaveGloballyButton && didPreferredFieldChange) {
      dispatch(openPopup(PopupType.ChangePreferredStatusGloballyPopup));
    } else {
      dispatch(
        savePackageInfo(
          selectedResourceId,
          attributionIdOfSelectedPackageInManualPanel,
          convertDisplayPackageInfoToPackageInfo(temporaryDisplayPackageInfo),
        ),
      );
    }
  }

  function openConfirmDeletionPopup(): void {
    if (!attributionIdOfSelectedPackageInManualPanel) {
      return;
    }
    if (temporaryDisplayPackageInfo.preSelected) {
      dispatch(
        deleteAttributionAndSave(
          selectedResourceId,
          attributionIdOfSelectedPackageInManualPanel,
        ),
      );
    } else {
      dispatch(
        openPopup(
          PopupType.ConfirmDeletionPopup,
          attributionIdOfSelectedPackageInManualPanel,
        ),
      );
    }
  }

  function openConfirmDeletionGloballyPopup(): void {
    if (!attributionIdOfSelectedPackageInManualPanel) {
      return;
    }

    if (temporaryDisplayPackageInfo.preSelected) {
      dispatch(
        deleteAttributionGloballyAndSave(
          attributionIdOfSelectedPackageInManualPanel,
        ),
      );
    } else {
      dispatch(
        openPopup(
          PopupType.ConfirmDeletionGloballyPopup,
          attributionIdOfSelectedPackageInManualPanel,
        ),
      );
    }
  }

  function saveFileRequestListener(): void {
    if (temporaryDisplayPackageInfo.wasPreferred) {
      dispatch(openPopup(PopupType.ModifyWasPreferredAttributionPopup));
    } else if (
      showSaveGloballyButton &&
      !isGlobalSavingDisabled &&
      didPreferredFieldChange
    ) {
      dispatch(openPopup(PopupType.ChangePreferredStatusGloballyPopup));
    } else if (
      showSaveGloballyButton &&
      isGlobalSavingDisabled &&
      attributionIdOfSelectedPackageInManualPanel
    ) {
      dispatch(
        unlinkAttributionAndSavePackageInfoIfSavingIsNotDisabled(
          selectedResourceId,
          attributionIdOfSelectedPackageInManualPanel,
          temporaryDisplayPackageInfo,
        ),
      );
    } else {
      dispatch(
        savePackageInfoIfSavingIsNotDisabled(
          selectedResourceId,
          attributionIdOfSelectedPackageInManualPanel,
          temporaryDisplayPackageInfo,
        ),
      );
    }
  }

  const showSaveGloballyButton: boolean = hasAttributionMultipleResources(
    attributionIdOfSelectedPackageInManualPanel,
    manualData.attributionsToResources,
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
      displayedPackage &&
        externalPackagePanels.includes(displayedPackage.panel),
    );
  }

  const showManualAttributionData: boolean =
    !shownDataIsFromExternalAttribution() || isShownDataEditable;
  const hideDeleteButtons =
    attributionIdOfSelectedPackageInManualPanel === null ||
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
      onSaveButtonClick={
        showSaveGloballyButton
          ? dispatchUnlinkAttributionAndSavePackageInfoOrOpenWasPreferredPopup
          : dispatchSavePackageInfoOrOpenPreferGloballyOrWasPreferredPopup
      }
      onSaveGloballyButtonClick={
        dispatchSavePackageInfoOrOpenPreferGloballyOrWasPreferredPopup
      }
      saveFileRequestListener={saveFileRequestListener}
      onDeleteButtonClick={openConfirmDeletionPopup}
      onDeleteGloballyButtonClick={openConfirmDeletionGloballyPopup}
    />
  ) : null;
}
