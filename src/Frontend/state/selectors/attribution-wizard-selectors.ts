// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { DisplayPackageInfo } from '../../../shared/shared-types';
import {
  PackageAttributeIds,
  PackageAttributes,
  State,
} from '../../types/types';

export function getAttributionWizarOriginalDisplayPackageInfo(
  state: State,
): DisplayPackageInfo {
  return state.resourceState.attributionWizard.originalDisplayPackageInfo;
}

export function getAttributionWizardPackageNamespaces(
  state: State,
): PackageAttributes {
  return state.resourceState.attributionWizard.packageNamespaces;
}

export function getAttributionWizardPackageNames(
  state: State,
): PackageAttributes {
  return state.resourceState.attributionWizard.packageNames;
}

export function getAttributionWizardPackageVersions(
  state: State,
): PackageAttributes {
  return state.resourceState.attributionWizard.packageVersions;
}

export function getAttributionWizardSelectedPackageAttributeIds(
  state: State,
): PackageAttributeIds {
  return state.resourceState.attributionWizard.selectedPackageAttributeIds;
}

export function getAttributionWizardTotalAttributionCount(
  state: State,
): number | null {
  return state.resourceState.attributionWizard.totalAttributionCount;
}
