// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackageInfo } from '../../../../shared/shared-types';
import {
  SelectedPackageAttributeIds,
  PackageAttributes,
} from '../../../types/types';
import {
  ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMES,
  ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMESPACES,
  ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_VERSIONS,
  ACTION_SET_ATTRIBUTION_WIZARD_POPUP_ATTRIBUTION,
  ACTION_SET_ATTRIBUTION_WIZARD_SELECTED_PACKAGE_IDS,
  ACTION_SET_ATTRIBUTION_WIZARD_TOTAL_ATTRIBUTION_COUNT,
  SetAttributionWizardPackageNames,
  SetAttributionWizardPackageNamespaces,
  SetAttributionWizardPackageVersions,
  SetAttributionWizardPopupAttribution,
  SetAttributionWizardSelectedPackageIds,
  SetAttributionWizardTotalAttributionCount,
} from './types';

export function setAttributionWizardPopupAttribution(
  popupAttribution: PackageInfo
): SetAttributionWizardPopupAttribution {
  return {
    type: ACTION_SET_ATTRIBUTION_WIZARD_POPUP_ATTRIBUTION,
    payload: popupAttribution,
  };
}

export function setAttributionWizardPackageNamespaces(
  sortedPackageNamespacesWithUuidsAndCounts: PackageAttributes
): SetAttributionWizardPackageNamespaces {
  return {
    type: ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMESPACES,
    payload: sortedPackageNamespacesWithUuidsAndCounts,
  };
}

export function setAttributionWizardPackageNames(
  sortedPackageNamesWithUuidsAndCounts: PackageAttributes
): SetAttributionWizardPackageNames {
  return {
    type: ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_NAMES,
    payload: sortedPackageNamesWithUuidsAndCounts,
  };
}

export function setAttributionWizardPackageVersions(
  sortedPackageVersionsWithUuidsAndRelatedPackageNameIds: PackageAttributes
): SetAttributionWizardPackageVersions {
  return {
    type: ACTION_SET_ATTRIBUTION_WIZARD_PACKAGE_VERSIONS,
    payload: sortedPackageVersionsWithUuidsAndRelatedPackageNameIds,
  };
}

export function setAttributionWizardSelectedPackageIds(
  packageIds: SelectedPackageAttributeIds
): SetAttributionWizardSelectedPackageIds {
  return {
    type: ACTION_SET_ATTRIBUTION_WIZARD_SELECTED_PACKAGE_IDS,
    payload: packageIds,
  };
}

export function setAttributionWizardTotalAttributionCount(
  totalAttributionCount: number | null
): SetAttributionWizardTotalAttributionCount {
  return {
    type: ACTION_SET_ATTRIBUTION_WIZARD_TOTAL_ATTRIBUTION_COUNT,
    payload: totalAttributionCount,
  };
}
