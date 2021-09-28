// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ButtonTitle, View } from '../../enums/enums';
import React from 'react';
import { FollowUp, PackageInfo } from '../../../shared/shared-types';
import { SimpleThunkDispatch } from '../../state/actions/types';
import { setTemporaryPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { PanelPackage } from '../../types/types';
import {
  addResolvedExternalAttribution,
  removeResolvedExternalAttribution,
} from '../../state/actions/resource-actions/audit-view-simple-actions';
import { saveManualAndResolvedAttributionsToFile } from '../../state/actions/resource-actions/save-actions';
import { MainButtonConfig } from '../ButtonGroup/ButtonGroup';
import { ContextMenuItem } from '../ContextMenu/ContextMenu';

export function getLicenseTextMaxRows(
  windowHeight: number,
  view: View
): number {
  const heightOfTextBoxes = 480;
  const heightOfNonLicenseTextComponents =
    heightOfTextBoxes + (view === View.Audit ? 34 : 0);
  const licenseTextMaxHeight = windowHeight - heightOfNonLicenseTextComponents;
  return Math.floor(licenseTextMaxHeight / 16);
}

export function getDiscreteConfidenceChangeHandler(
  temporaryPackageInfo: PackageInfo,
  dispatch: SimpleThunkDispatch
): (event: React.ChangeEvent<{ value: unknown }>) => void {
  return (event): void => {
    dispatch(
      setTemporaryPackageInfo({
        ...temporaryPackageInfo,
        attributionConfidence: Number(event.target.value),
      })
    );
  };
}

export function getFollowUpChangeHandler(
  temporaryPackageInfo: PackageInfo,
  dispatch: SimpleThunkDispatch
): (event: React.ChangeEvent<HTMLInputElement>) => void {
  return (event): void => {
    dispatch(
      setTemporaryPackageInfo({
        ...temporaryPackageInfo,
        followUp: event.target.checked ? FollowUp : undefined,
      })
    );
  };
}

export function getExcludeFromNoticeChangeHandler(
  temporaryPackageInfo: PackageInfo,
  dispatch: SimpleThunkDispatch
): (event: React.ChangeEvent<HTMLInputElement>) => void {
  return (event): void => {
    dispatch(
      setTemporaryPackageInfo({
        ...temporaryPackageInfo,
        excludeFromNotice: event.target.checked ? true : undefined,
      })
    );
  };
}

export function getFirstPartyChangeHandler(
  temporaryPackageInfo: PackageInfo,
  dispatch: SimpleThunkDispatch
): (event: React.ChangeEvent<HTMLInputElement>) => void {
  return (event): void => {
    dispatch(
      setTemporaryPackageInfo({
        ...temporaryPackageInfo,
        firstParty: event.target.checked,
      })
    );
  };
}

export function getResolvedToggleHandler(
  selectedPackage: PanelPackage | null,
  resolvedExternalAttributions: Set<string>,
  dispatch: SimpleThunkDispatch
): () => void {
  return (): void => {
    if (selectedPackage) {
      if (resolvedExternalAttributions.has(selectedPackage.attributionId)) {
        dispatch(
          removeResolvedExternalAttribution(selectedPackage.attributionId)
        );
      } else {
        dispatch(addResolvedExternalAttribution(selectedPackage.attributionId));
      }
      dispatch(saveManualAndResolvedAttributionsToFile());
    }
  };
}

export function selectedPackageIsResolved(
  selectedPackage: PanelPackage | null,
  resolvedExternalAttributions: Set<string>
): boolean {
  return selectedPackage
    ? resolvedExternalAttributions.has(selectedPackage.attributionId)
    : false;
}

export function getLicenseTextLabelText(
  licenseName: string | undefined,
  isEditable: boolean,
  frequentLicensesNameOrder: Array<string>
): string {
  return licenseName &&
    frequentLicensesNameOrder
      .map((name) => name.toLowerCase())
      .includes(licenseName.toLowerCase())
    ? `Standard license text implied. ${
        isEditable ? 'Insert notice text if necessary.' : ''
      }`
    : 'License Text (to appear in attribution document)';
}

export function getMainButtonConfigs(
  temporaryPackageInfo: PackageInfo,
  isSavingDisabled: boolean,
  onSaveButtonClick: () => void,
  onSaveForAllButtonClick: () => void,
  showSaveForAllButton: boolean
): Array<MainButtonConfig> {
  return [
    {
      buttonText: temporaryPackageInfo.preSelected
        ? ButtonTitle.Confirm
        : ButtonTitle.Save,
      disabled: isSavingDisabled,
      onClick: onSaveButtonClick,
      hidden: false,
    },
    {
      buttonText: temporaryPackageInfo.preSelected
        ? ButtonTitle.ConfirmForAll
        : ButtonTitle.SaveForAll,
      disabled: isSavingDisabled,
      onClick: onSaveForAllButtonClick,
      hidden: !showSaveForAllButton,
    },
  ];
}

export function getContextMenuButtonConfigs(
  packageInfoWereModified: boolean,
  onDeleteButtonClick: () => void,
  onDeleteForAllButtonClick: () => void,
  hideDeleteButtons: boolean,
  onUndoButtonClick: () => void,
  showSaveForAllButton: boolean,
  onMarkForReplacementButtonClick: () => void,
  hideMarkForReplacementButton: boolean,
  onUnmarkForReplacementButtonClick: () => void,
  hideUnmarkForReplacementButton: boolean,
  onReplaceMarkedByButtonClick: () => void,
  hideOnReplaceMarkedByButton: boolean,
  deactivateReplaceMarkedByButton: boolean
): Array<ContextMenuItem> {
  return [
    {
      buttonTitle: ButtonTitle.Undo,
      disabled: !packageInfoWereModified,
      onClick: onUndoButtonClick,
    },
    {
      buttonTitle: ButtonTitle.Delete,
      onClick: onDeleteButtonClick,
      hidden: hideDeleteButtons,
    },
    {
      buttonTitle: ButtonTitle.DeleteForAll,
      onClick: onDeleteForAllButtonClick,
      hidden: hideDeleteButtons || !showSaveForAllButton,
    },
    {
      buttonTitle: ButtonTitle.MarkForReplacement,
      onClick: onMarkForReplacementButtonClick,
      hidden: hideMarkForReplacementButton,
    },
    {
      buttonTitle: ButtonTitle.UnmarkForReplacement,
      onClick: onUnmarkForReplacementButtonClick,
      hidden: hideUnmarkForReplacementButton,
    },
    {
      buttonTitle: ButtonTitle.ReplaceMarkedBy,
      disabled: deactivateReplaceMarkedByButton,
      onClick: onReplaceMarkedByButtonClick,
      hidden: hideOnReplaceMarkedByButton,
    },
  ];
}

interface MergeButtonDisplayState {
  hideMarkForReplacementButton: boolean;
  hideUnmarkForReplacementButton: boolean;
  hideOnReplaceMarkedByButton: boolean;
  deactivateReplaceMarkedByButton: boolean;
}

export function getMergeButtonsDisplayState(
  currentView: View,
  attributionIdMarkedForReplacement: string,
  selectedAttributionId: string,
  packageInfoWereModified: boolean,
  attributionIsPreSelected: boolean
): MergeButtonDisplayState {
  const isAttributionView = currentView === View.Attribution;
  const anyAttributionMarkedForReplacement =
    attributionIdMarkedForReplacement !== '';
  const selectedAttributionIsMarkedForReplacement =
    selectedAttributionId === attributionIdMarkedForReplacement;

  return {
    hideMarkForReplacementButton:
      !isAttributionView ||
      anyAttributionMarkedForReplacement ||
      selectedAttributionIsMarkedForReplacement,
    hideUnmarkForReplacementButton:
      !isAttributionView ||
      !anyAttributionMarkedForReplacement ||
      !selectedAttributionIsMarkedForReplacement,
    hideOnReplaceMarkedByButton:
      !isAttributionView ||
      !anyAttributionMarkedForReplacement ||
      selectedAttributionIsMarkedForReplacement,
    deactivateReplaceMarkedByButton:
      packageInfoWereModified || attributionIsPreSelected,
  };
}
