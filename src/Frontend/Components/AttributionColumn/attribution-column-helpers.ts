// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';

import {
  DisplayPackageInfo,
  FrequentLicenseName,
} from '../../../shared/shared-types';
import { AllowedSaveOperations, View } from '../../enums/enums';
import { ADD_NEW_ATTRIBUTION_BUTTON_ID } from '../../shared-constants';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import {
  addResolvedExternalAttribution,
  removeResolvedExternalAttribution,
} from '../../state/actions/resource-actions/audit-view-simple-actions';
import {
  saveManualAndResolvedAttributionsToFile,
  setAllowedSaveOperations,
} from '../../state/actions/resource-actions/save-actions';
import { AppThunkDispatch } from '../../state/types';
import { PanelPackage } from '../../types/types';
import {
  generatePurlFromDisplayPackageInfo,
  parsePurl,
} from '../../util/handle-purl';
import { isExternalPackagePanel } from '../../util/is-external-package-panel';
import { isNamespaceRequiredButMissing } from '../../util/is-important-attribution-information-missing';

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
      currentState.view !== View.Audit ||
      Boolean(currentState.attributionIsPreferred),
    hideUnmarkAsPreferredButton:
      !currentState.isPreferenceFeatureEnabled ||
      !currentState.selectedAttributionId ||
      currentState.view !== View.Audit ||
      !currentState.attributionIsPreferred,
  };
}

export function usePurl(
  dispatch: AppThunkDispatch,
  packageInfoWereModified: boolean,
  temporaryDisplayPackageInfo: DisplayPackageInfo,
  selectedPackage: PanelPackage | null,
  selectedAttributionId: string | null,
): {
  temporaryPurl: string;
  isDisplayedPurlValid: boolean;
  handlePurlChange: (event: React.ChangeEvent<{ value: string }>) => void;
  updatePurl: (displayPackageInfo: DisplayPackageInfo) => void;
} {
  const [temporaryPurl, setTemporaryPurl] = useState<string>('');
  const isDisplayedPurlValid: boolean =
    parsePurl(temporaryPurl).isValid &&
    !isNamespaceRequiredButMissing(
      temporaryDisplayPackageInfo.packageType,
      temporaryDisplayPackageInfo.packageNamespace,
    );

  const isAllSavingDisabled =
    (!packageInfoWereModified || !isDisplayedPurlValid) &&
    !temporaryDisplayPackageInfo.preSelected;

  const savingStatus = isAllSavingDisabled
    ? AllowedSaveOperations.None
    : AllowedSaveOperations.All;

  useEffect(() => {
    dispatch(setAllowedSaveOperations(savingStatus));
  }, [dispatch, savingStatus]);

  useEffect(
    () => {
      setTemporaryPurl(
        generatePurlFromDisplayPackageInfo(temporaryDisplayPackageInfo) || '',
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      selectedPackage?.panel,
      selectedPackage?.packageCardId,
      selectedAttributionId,
      temporaryDisplayPackageInfo.packageType,
      temporaryDisplayPackageInfo.packageNamespace,
      temporaryDisplayPackageInfo.packageName,
      temporaryDisplayPackageInfo.packageVersion,
    ],
  );

  function handlePurlChange(event: React.ChangeEvent<{ value: string }>): void {
    const enteredPurl = event.target.value;
    setTemporaryPurl(enteredPurl);
    const { isValid, purl } = parsePurl(enteredPurl);

    if (isValid && purl) {
      dispatch(
        setTemporaryDisplayPackageInfo({
          ...temporaryDisplayPackageInfo,
          packageName: purl.packageName,
          packageVersion: purl.packageVersion,
          packageNamespace: purl.packageNamespace,
          packageType: purl.packageType,
          packagePURLAppendix: purl.packagePURLAppendix,
        }),
      );
    }
  }

  function updatePurl(displayPackageInfo: DisplayPackageInfo): void {
    const purl = generatePurlFromDisplayPackageInfo(displayPackageInfo);
    setTemporaryPurl(purl);
  }

  return {
    temporaryPurl,
    isDisplayedPurlValid,
    handlePurlChange,
    updatePurl,
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
