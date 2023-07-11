// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  ListWithAttributesItem,
  PackageAttributeIds,
  PackageAttributes,
} from '../../types/types';

export function getSelectedPackageAttributes(
  packageNamespaces: PackageAttributes,
  packageNames: PackageAttributes,
  packageVersions: PackageAttributes,
  selectedPackageIds: PackageAttributeIds,
): {
  selectedPackageNamespace: string;
  selectedPackageName: string;
  selectedPackageVersion: string;
} {
  const selectedPackageNamespace =
    packageNamespaces[selectedPackageIds.namespaceId].text;
  const selectedPackageName = packageNames[selectedPackageIds.nameId].text;
  const selectedPackageVersion =
    packageVersions[selectedPackageIds.versionId].text;

  return {
    selectedPackageNamespace,
    selectedPackageName,
    selectedPackageVersion,
  };
}

export function getAttributionWizardListItems(
  packageNamespaces: PackageAttributes,
  packageNames: PackageAttributes,
  packageVersions: PackageAttributes,
  totalAttributionCount: number,
): {
  attributedPackageNamespacesWithManuallyAddedOnes: Array<ListWithAttributesItem>;
  attributedPackageNamesWithManuallyAddedOnes: Array<ListWithAttributesItem>;
  attributedPackageVersionsWithManuallyAddedOnes: Array<ListWithAttributesItem>;
} {
  const attributedPackageNamespacesWithManuallyAddedOnes = Object.entries(
    packageNamespaces,
  ).map(([uuid, textAndCountAndManuallyAddedFlag]) => ({
    text: textAndCountAndManuallyAddedFlag.text,
    id: uuid,
    manuallyAdded: textAndCountAndManuallyAddedFlag.manuallyAdded,
    attributes: Boolean(textAndCountAndManuallyAddedFlag.manuallyAdded)
      ? undefined
      : [
          {
            text: getCountText(
              textAndCountAndManuallyAddedFlag.count || 0,
              totalAttributionCount,
            ),
          },
        ],
  }));

  const attributedPackageNamesWithManuallyAddedOnes = Object.entries(
    packageNames,
  ).map(([uuid, textAndCountAndManuallyAddedFlag]) => ({
    text: textAndCountAndManuallyAddedFlag.text,
    id: uuid,
    manuallyAdded: textAndCountAndManuallyAddedFlag.manuallyAdded,
    attributes: Boolean(textAndCountAndManuallyAddedFlag.manuallyAdded)
      ? undefined
      : [
          {
            text: getCountText(
              textAndCountAndManuallyAddedFlag.count || 0,
              totalAttributionCount,
            ),
          },
        ],
  }));

  const attributedPackageVersionsWithManuallyAddedOnes = Object.entries(
    packageVersions,
  ).map(([uuid, textAndRelatedIdsAndManuallyAddedFlag]) => ({
    text: textAndRelatedIdsAndManuallyAddedFlag.text,
    id: uuid,
    manuallyAdded: textAndRelatedIdsAndManuallyAddedFlag.manuallyAdded,
    attributes: Boolean(textAndRelatedIdsAndManuallyAddedFlag.manuallyAdded)
      ? undefined
      : Array.from(textAndRelatedIdsAndManuallyAddedFlag.relatedIds ?? []).map(
          (relatedPackageNameIds) => ({
            text: packageNames[relatedPackageNameIds].text,
            id: relatedPackageNameIds,
          }),
        ),
  }));

  return {
    attributedPackageNamespacesWithManuallyAddedOnes,
    attributedPackageNamesWithManuallyAddedOnes,
    attributedPackageVersionsWithManuallyAddedOnes,
  };
}

function getCountText(count: number, totalAttributeCount: number): string {
  const percentageFactor = 100;
  const percentage = (count / totalAttributeCount) * percentageFactor;
  return percentage < 1
    ? `${count} (< 1%)`
    : `${count} (${percentage.toFixed(0)}%)`;
}
