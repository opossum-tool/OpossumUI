// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackageInfo } from '../../../shared/shared-types';
import {
  SelectedPackageAttributeIds,
  State,
  PackageAttributes,
} from '../../types/types';

export function getAttributionWizardPopupAttribution(
  state: State
): PackageInfo {
  return state.resourceState.attributionWizard.popupAttribution;
}

export function getAttributionWizardPackageNamespaces(
  state: State
): PackageAttributes {
  return state.resourceState.attributionWizard.packageNamespaces;
}

export function getAttributionWizardPackageNames(
  state: State
): PackageAttributes {
  return state.resourceState.attributionWizard.packageNames;
}

export function getAttributionWizardPackageVersions(
  state: State
): PackageAttributes {
  return state.resourceState.attributionWizard.packageVersions;
}

export function getAttributionWizardPackageNamesToVersions(state: State): {
  [name: string]: Set<string>;
} {
  return state.resourceState.attributionWizard.packageNamesToVersions;
}

export function getAttributionWizardPackageVersionsToNames(state: State): {
  [version: string]: Set<string>;
} {
  return state.resourceState.attributionWizard.packageNamesToVersions;
}

export function getAttributionWizardSelectedPackageIds(
  state: State
): SelectedPackageAttributeIds {
  return state.resourceState.attributionWizard.selectedPackageAttributeIds;
}

export function getAttributionWizardTotalAttributionCount(
  state: State
): number | null {
  return state.resourceState.attributionWizard.totalAttributionCount;
}
