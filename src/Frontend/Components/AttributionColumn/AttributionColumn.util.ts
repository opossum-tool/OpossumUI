// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { FrequentLicenseName } from '../../../shared/shared-types';
import {
  addResolvedExternalAttribution,
  removeResolvedExternalAttribution,
} from '../../state/actions/resource-actions/audit-view-simple-actions';
import { saveManualAndResolvedAttributionsToFile } from '../../state/actions/resource-actions/save-actions';
import { AppThunkDispatch } from '../../state/types';

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
