// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackageInfo } from '../../../shared/shared-types';
import {
  PackageAttributeIds,
  State,
  PackageAttributes,
} from '../../types/types';

export function getAttributionWizarOriginalAttribution(
  state: State
): PackageInfo {
  return state.resourceState.attributionWizard.originalAttribution;
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

export function getAttributionWizardSelectedPackageAttributeIds(
  state: State
): PackageAttributeIds {
  return state.resourceState.attributionWizard.selectedPackageAttributeIds;
}

export function getAttributionWizardTotalAttributionCount(
  state: State
): number | null {
  return state.resourceState.attributionWizard.totalAttributionCount;
}
