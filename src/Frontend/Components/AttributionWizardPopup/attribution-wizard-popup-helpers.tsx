// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { max } from 'lodash';
import {
  ListWithAttributesItem,
  SelectedPackageAttributeIds,
  PackageAttributes,
} from '../../types/types';

export function getSelectedPackageAttributes(
  packageNamespaces: PackageAttributes,
  packageNames: PackageAttributes,
  packageVersions: PackageAttributes,
  selectedPackageIds: SelectedPackageAttributeIds
): {
  selectedPackageNamespace: string;
  selectedPackageName: string;
  selectedPackageVersion: string;
} {
  const selectedPackageNamespace =
    packageNamespaces[selectedPackageIds.selectedPackageNamespaceId].text;
  const selectedPackageName =
    packageNames[selectedPackageIds.selectedPackageNameId].text;
  const selectedPackageVersion =
    packageVersions[selectedPackageIds.selectedPackageVersionId].text;

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
  totalAttributionCount: number
): {
  attributedPackageNamespacesWithManuallyAddedOnes: Array<ListWithAttributesItem>;
  attributedPackageNamesWithManuallyAddedOnes: Array<ListWithAttributesItem>;
  attributedPackageVersionsWithManuallyAddedOnes: Array<ListWithAttributesItem>;
} {
  const attributedPackageNamespacesWithManuallyAddedOnes = Object.entries(
    packageNamespaces
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
              totalAttributionCount
            ),
          },
        ],
  }));

  const attributedPackageNamesWithManuallyAddedOnes = Object.entries(
    packageNames
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
              totalAttributionCount
            ),
          },
        ],
  }));

  const attributedPackageVersionsWithManuallyAddedOnes = Object.entries(
    packageVersions
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
          })
        ),
  }));

  return {
    attributedPackageNamespacesWithManuallyAddedOnes,
    attributedPackageNamesWithManuallyAddedOnes,
    attributedPackageVersionsWithManuallyAddedOnes,
  };
}

function getCountText(count: number, totalAttributeCount: number): string {
  const percentage = (count / totalAttributeCount) * 100;
  return percentage < 1
    ? `${count} (< 1%)`
    : `${count} (${percentage.toFixed(0)}%)`;
}

export function sortAttributedPackageItems(
  attributedPackageItems: Array<ListWithAttributesItem>
): Array<ListWithAttributesItem> {
  return attributedPackageItems.sort(compareAttributedPackageItems);
}
function compareAttributedPackageItems(
  attributedPackageItemA: ListWithAttributesItem,
  attributedPackageItemB: ListWithAttributesItem
): number {
  const manuallyAddedA = Boolean(attributedPackageItemA.manuallyAdded);
  const manuallyAddedB = Boolean(attributedPackageItemB.manuallyAdded);

  if (manuallyAddedA !== manuallyAddedB) {
    return manuallyAddedA ? -1 : 1;
  } else if (manuallyAddedA && manuallyAddedB) {
    const textA = attributedPackageItemA.text;
    const textB = attributedPackageItemB.text;
    return textA.toLowerCase() < textB.toLowerCase() ? -1 : 1;
  }

  const countA =
    attributedPackageItemA.attributes !== undefined
      ? parseInt(attributedPackageItemA.attributes[0].text.split(' ')[0])
      : 0;
  const countB =
    attributedPackageItemB.attributes !== undefined
      ? parseInt(attributedPackageItemB.attributes[0].text.split(' ')[0])
      : 0;

  if (countA !== countB) {
    return countB - countA;
  } else {
    const textA = attributedPackageItemA.text;
    const textB = attributedPackageItemB.text;
    return textA.toLowerCase() < textB.toLowerCase() ? -1 : 1;
  }
}

export function sortAttributedPackageVersions(
  attributedPackageVersions: Array<ListWithAttributesItem>,
  highlightedPackageNameId: string
): Array<ListWithAttributesItem> {
  return attributedPackageVersions.sort(
    (attributedPackageVersionA, attributedPackageVersionB) =>
      compareVersionAttributeHighlighting(
        attributedPackageVersionA,
        attributedPackageVersionB,
        highlightedPackageNameId
      )
  );
}

function compareVersionAttributeHighlighting(
  attributedPackageVersionA: ListWithAttributesItem,
  attributedPackageVersionB: ListWithAttributesItem,
  highlightedPackageNameId: string
): number {
  const manuallyAddedA = Boolean(attributedPackageVersionA.manuallyAdded);
  const manuallyAddedB = Boolean(attributedPackageVersionB.manuallyAdded);

  if (manuallyAddedA !== manuallyAddedB) {
    return manuallyAddedA ? -1 : 1;
  } else if (manuallyAddedA && manuallyAddedB) {
    const textA = attributedPackageVersionA.text;
    const textB = attributedPackageVersionB.text;
    return textA.toLowerCase() < textB.toLowerCase() ? -1 : 1;
  }

  const attributeIdsA = attributedPackageVersionA.attributes?.map(
    (attribute) => attribute.id
  );
  const attributeIdsB = attributedPackageVersionB.attributes?.map(
    (attribute) => attribute.id
  );

  const matchA = attributeIdsA?.includes(highlightedPackageNameId);
  const matchB = attributeIdsB?.includes(highlightedPackageNameId);

  return matchA !== matchB
    ? matchA
      ? -1
      : 1
    : compareSemanticVersion(
        attributedPackageVersionA.text,
        attributedPackageVersionB.text
      );
}

function compareSemanticVersion(versionA: string, versionB: string): number {
  const versionASplit = versionA.split('.');
  const versionBSplit = versionB.split('.');
  const maxLength = max([versionASplit.length, versionBSplit.length]) ?? 0;
  for (
    let versionPartIndex = 0;
    versionPartIndex < maxLength;
    versionPartIndex++
  ) {
    const versionAPart = parseInt(versionASplit[versionPartIndex]);
    const versionBPart = parseInt(versionBSplit[versionPartIndex]);

    if (isNaN(versionAPart) || isNaN(versionBPart)) {
      return isNaN(versionAPart) ? 1 : -1;
    }

    if (versionAPart - versionBPart !== 0) {
      return versionAPart - versionBPart;
    }
  }
  return 0;
}
