// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DisplayPackageInfo } from '../../../../shared/shared-types';
import { PackageAttributeIds, PackageAttributes } from '../../../types/types';
import {
  ACTION_SET_ATTRIBUTION_WIZARD_ORIGINAL_ATTRIBUTION,
  ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMES,
  ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMESPACES,
  ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_VERSIONS,
  ACTION_SET_ATTRIBUTION_WIZARD_SELECTED_PACKAGE_IDS,
  ACTION_SET_ATTRIBUTION_WIZARD_TOTAL_ATTRIBUTION_COUNT,
  SetAttributionWizardOriginalAttribution,
  SetAttributionWizardPackageNames,
  SetAttributionWizardPackageNamespaces,
  SetAttributionWizardPackageVersions,
  SetAttributionWizardSelectedPackageIds,
  SetAttributionWizardTotalAttributionCount,
} from './types';

export function setAttributionWizardOriginalAttribution(
  originalDisplayPackageInfo: DisplayPackageInfo,
): SetAttributionWizardOriginalAttribution {
  return {
    type: ACTION_SET_ATTRIBUTION_WIZARD_ORIGINAL_ATTRIBUTION,
    payload: originalDisplayPackageInfo,
  };
}

export function setAttributionWizardPackageNamespaces(
  sortedPackageNamespacesWithUuidsAndCounts: PackageAttributes,
): SetAttributionWizardPackageNamespaces {
  return {
    type: ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMESPACES,
    payload: sortedPackageNamespacesWithUuidsAndCounts,
  };
}

export function setAttributionWizardPackageNames(
  sortedPackageNamesWithUuidsAndCounts: PackageAttributes,
): SetAttributionWizardPackageNames {
  return {
    type: ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMES,
    payload: sortedPackageNamesWithUuidsAndCounts,
  };
}

export function setAttributionWizardPackageVersions(
  sortedPackageVersionsWithUuidsAndRelatedPackageNameIds: PackageAttributes,
): SetAttributionWizardPackageVersions {
  return {
    type: ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_VERSIONS,
    payload: sortedPackageVersionsWithUuidsAndRelatedPackageNameIds,
  };
}

export function setAttributionWizardSelectedPackageIds(
  packageIds: PackageAttributeIds,
): SetAttributionWizardSelectedPackageIds {
  return {
    type: ACTION_SET_ATTRIBUTION_WIZARD_SELECTED_PACKAGE_IDS,
    payload: packageIds,
  };
}

export function setAttributionWizardTotalAttributionCount(
  totalAttributionCount: number | null,
): SetAttributionWizardTotalAttributionCount {
  return {
    type: ACTION_SET_ATTRIBUTION_WIZARD_TOTAL_ATTRIBUTION_COUNT,
    payload: totalAttributionCount,
  };
}
