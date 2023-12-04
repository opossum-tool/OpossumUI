// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { FrequentLicenseName } from '../../../shared/shared-types';
import { View } from '../../enums/enums';
import { ADD_NEW_ATTRIBUTION_BUTTON_ID } from '../../shared-constants';
import {
  addResolvedExternalAttribution,
  removeResolvedExternalAttribution,
} from '../../state/actions/resource-actions/audit-view-simple-actions';
import { saveManualAndResolvedAttributionsToFile } from '../../state/actions/resource-actions/save-actions';
import { AppThunkDispatch } from '../../state/types';
import { PanelPackage } from '../../types/types';
import { isExternalPackagePanel } from '../../util/is-external-package-panel';

export function getResolvedToggleHandler(
  attributionIds: Array<string>,
  resolvedExternalAttributions: Set<string>,
  dispatch: AppThunkDispatch,
): () => void {
  return (): void => {
    if (
      selectedPackagesAreResolved(attributionIds, resolvedExternalAttributions)
    ) {
      for (const attributionId of attributionIds) {
        dispatch(removeResolvedExternalAttribution(attributionId));
      }
    } else {
      for (const attributionId of attributionIds) {
        dispatch(addResolvedExternalAttribution(attributionId));
      }
    }
    dispatch(saveManualAndResolvedAttributionsToFile());
  };
}

export function selectedPackagesAreResolved(
  attributionIds: Array<string>,
  resolvedExternalAttributions: Set<string>,
): boolean {
  return attributionIds.length > 0
    ? attributionIds.every((attributionId) =>
        resolvedExternalAttributions.has(attributionId),
      )
    : false;
}

export function getLicenseTextLabelText(
  licenseName: string | undefined,
  isEditable: boolean,
  frequentLicensesNameOrder: Array<FrequentLicenseName>,
): string {
  return licenseName &&
    frequentLicensesNameOrder
      .map((licenseNames) => [
        licenseNames.shortName.toLowerCase(),
        licenseNames.fullName.toLowerCase(),
      ])
      .flat()
      .includes(licenseName.toLowerCase())
    ? `Standard license text implied. ${
        isEditable ? 'Insert notice text if necessary.' : ''
      }`
    : 'License Text (to appear in attribution document)';
}

export interface MergeButtonDisplayState {
  hideMarkForReplacementButton: boolean;
  hideUnmarkForReplacementButton: boolean;
  hideReplaceMarkedByButton: boolean;
  deactivateReplaceMarkedByButton: boolean;
  hideMarkAsPreferredButton: boolean;
  hideUnmarkAsPreferredButton: boolean;
}

export function getMergeButtonsDisplayState(currentState: {
  attributionIdMarkedForReplacement: string;
  targetAttributionId: string;
  selectedAttributionId: string;
  packageInfoWereModified: boolean;
  targetAttributionIsPreSelected: boolean;
  targetAttributionIsExternalAttribution: boolean;
  isPreferenceFeatureEnabled?: boolean;
  attributionIsPreferred?: boolean;
  view?: View;
}): MergeButtonDisplayState {
  const anyAttributionMarkedForReplacement =
    currentState.attributionIdMarkedForReplacement !== '';
  const targetAttributionIsMarkedForReplacement =
    currentState.targetAttributionId ===
    currentState.attributionIdMarkedForReplacement;
  const selectedAttributionIsPartOfMerge =
    currentState.selectedAttributionId ===
      currentState.attributionIdMarkedForReplacement ||
    currentState.selectedAttributionId === currentState.targetAttributionId;

  return {
    hideMarkForReplacementButton:
      currentState.targetAttributionIsExternalAttribution ||
      targetAttributionIsMarkedForReplacement,
    hideUnmarkForReplacementButton:
      currentState.targetAttributionIsExternalAttribution ||
      !anyAttributionMarkedForReplacement ||
      !targetAttributionIsMarkedForReplacement,
    hideReplaceMarkedByButton:
      currentState.targetAttributionIsExternalAttribution ||
      !anyAttributionMarkedForReplacement ||
      targetAttributionIsMarkedForReplacement,
    deactivateReplaceMarkedByButton:
      (selectedAttributionIsPartOfMerge &&
        currentState.packageInfoWereModified) ||
      currentState.targetAttributionIsPreSelected,
    hideMarkAsPreferredButton:
      !currentState.isPreferenceFeatureEnabled ||
      !currentState.selectedAttributionId ||
      Boolean(currentState.attributionIsPreferred),
    hideUnmarkAsPreferredButton:
      !currentState.isPreferenceFeatureEnabled ||
      !currentState.selectedAttributionId ||
      !currentState.attributionIsPreferred,
  };
}

export function getSelectedManualAttributionIdForAuditView(
  selectedPackage: PanelPackage | null,
): string {
  if (
    selectedPackage &&
    !isExternalPackagePanel(selectedPackage.panel) &&
    selectedPackage.packageCardId !== ADD_NEW_ATTRIBUTION_BUTTON_ID
  ) {
    return selectedPackage.displayPackageInfo.attributionIds[0];
  }
  return '';
}
