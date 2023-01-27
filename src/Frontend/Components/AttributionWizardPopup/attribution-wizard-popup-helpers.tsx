// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  AttributionIdWithCount,
  Attributions,
  PackageInfo,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import { ListWithAttributesItem } from '../../types/types';
import { getAttributedChildren } from '../../util/get-attributed-children';
import { shouldNotBeCalled } from '../../util/should-not-be-called';

interface TextAndCount {
  text: string;
  count: number;
}

interface NamesWithCounts {
  [name: string]: number;
}

export const emptyAttribute = '-';

export function getAllAttributionIdsWithCountsFromResourceAndChildren(
  selectedResourceId: string,
  externalData: AttributionData,
  manualData: AttributionData,
  resolvedExternalAttributions: Set<string>
): Array<AttributionIdWithCount> {
  const externalAttributedChildren = getAttributedChildren(
    externalData.resourcesWithAttributedChildren,
    selectedResourceId
  );
  if (selectedResourceId in externalData.resourcesToAttributions) {
    externalAttributedChildren.add(selectedResourceId);
  }

  const manualAttributedChildren = getAttributedChildren(
    manualData.resourcesWithAttributedChildren,
    selectedResourceId
  );
  if (selectedResourceId in manualData.resourcesToAttributions) {
    manualAttributedChildren.add(selectedResourceId);
  }

  const externalAttributionsWithCounts = getAggregatedAttributionIdsAndCounts(
    externalData.resourcesToAttributions,
    externalAttributedChildren,
    resolvedExternalAttributions
  );
  const manualAttributionsWithCounts = getAggregatedAttributionIdsAndCounts(
    manualData.resourcesToAttributions,
    manualAttributedChildren
  );

  return externalAttributionsWithCounts.concat(manualAttributionsWithCounts);
}

function getAggregatedAttributionIdsAndCounts(
  resourcesToAttributions: ResourcesToAttributions,
  attributedChildren: Set<string>,
  resolvedExternalAttributions?: Set<string>
): Array<AttributionIdWithCount> {
  const attributionCount: { [attributionId: string]: number } = {};
  attributedChildren.forEach((child: string) => {
    resourcesToAttributions[child].forEach((attributionId: string) => {
      if (
        !resolvedExternalAttributions ||
        !resolvedExternalAttributions.has(attributionId)
      ) {
        attributionCount[attributionId] =
          (attributionCount[attributionId] || 0) + 1;
      }
    });
  });

  return Object.entries(attributionCount).map(([attributionId, count]) => ({
    attributionId,
    count,
  }));
}

export function getPreSelectedPackageAttributeIds(popupPackage: PackageInfo): {
  preSelectedPackageNamespaceId: string;
  preSelectedPackageNameId: string;
  preSelectedPackageVersionId: string;
} {
  const namespace = popupPackage.packageNamespace || emptyAttribute;
  const name = popupPackage.packageName || emptyAttribute;
  const version = popupPackage.packageVersion || emptyAttribute;

  const preSelectedPackageNamespaceId = `namespace-${namespace}`;
  const preSelectedPackageNameId = `name-${name}`;
  const preSelectedPackageVersionId = `version-${version}`;

  return {
    preSelectedPackageNamespaceId,
    preSelectedPackageNameId,
    preSelectedPackageVersionId,
  };
}

export function getAttributionWizardPackageListsItems(
  externalAndManualAttributionIdsWithCounts: Array<AttributionIdWithCount>,
  externalAndManualAttributions: Attributions
): {
  attributedPackageNamespaces: Array<ListWithAttributesItem>;
  attributedPackageNames: Array<ListWithAttributesItem>;
  packageNamesToVersions: { [packageName: string]: Set<string> };
} {
  const totalAttributionCount = externalAndManualAttributionIdsWithCounts
    .map((attributionIdWithCount) => attributionIdWithCount.count ?? 0)
    .reduce(
      (accumulatedCounts, currentCount) => accumulatedCounts + currentCount,
      0
    );

  const packageNamespacesAndCounts = getPackageAttributesAndCounts(
    externalAndManualAttributionIdsWithCounts,
    externalAndManualAttributions,
    'namespace'
  );
  const packageNamesAndCounts = getPackageAttributesAndCounts(
    externalAndManualAttributionIdsWithCounts,
    externalAndManualAttributions,
    'name'
  );

  const packageNamesToVersions = getPackageNamesToVersions(
    externalAndManualAttributionIdsWithCounts,
    externalAndManualAttributions
  );

  const packageNamespacesWithCounts = sortPackageAttributesAndCounts(
    packageNamespacesAndCounts
  );
  const packageNamesWithCounts = sortPackageAttributesAndCounts(
    packageNamesAndCounts
  );

  const attributedPackageNamespaces = getWizardListItems(
    packageNamespacesWithCounts,
    totalAttributionCount,
    'namespace'
  );
  const attributedPackageNames = getWizardListItems(
    packageNamesWithCounts,
    totalAttributionCount,
    'name'
  );

  return {
    attributedPackageNamespaces,
    attributedPackageNames,
    packageNamesToVersions,
  };
}

function getPackageAttributesAndCounts(
  externalAndManualAttributionIdsWithCounts: Array<AttributionIdWithCount>,
  externalAndManualAttributions: Attributions,
  packageAttributeId: 'namespace' | 'name'
): NamesWithCounts {
  const packageAttributesAndCounts: NamesWithCounts = {};
  for (const attributionIdWithCount of externalAndManualAttributionIdsWithCounts) {
    const packageInfo =
      externalAndManualAttributions[attributionIdWithCount.attributionId];
    const packageCount = attributionIdWithCount.count ?? 0;

    let packageAttribute: string;
    if (packageAttributeId === 'namespace') {
      packageAttribute = packageInfo.packageNamespace || emptyAttribute;
    } else if (packageAttributeId === 'name') {
      packageAttribute = packageInfo.packageName || emptyAttribute;
    } else {
      shouldNotBeCalled(packageAttributeId);
    }

    packageAttributesAndCounts[packageAttribute] =
      (packageAttributesAndCounts[packageAttribute] ?? 0) + packageCount;
  }

  return packageAttributesAndCounts;
}

function getPackageNamesToVersions(
  containedExternalPackages: Array<AttributionIdWithCount>,
  externalAttributions: Attributions
): { [packageName: string]: Set<string> } {
  const packageNamesToVersions: { [packageName: string]: Set<string> } = {};
  for (const containedExternalPackage of containedExternalPackages) {
    const packageInfo =
      externalAttributions[containedExternalPackage.attributionId];

    const packageName = packageInfo.packageName || emptyAttribute;
    const packageVersion = packageInfo.packageVersion || emptyAttribute;

    packageNamesToVersions[packageName] ??
      (packageNamesToVersions[packageName] = new Set<string>());
    packageNamesToVersions[packageName].add(packageVersion);
  }

  return packageNamesToVersions;
}

function sortPackageAttributesAndCounts(packageAttributesAndCounts: {
  [text: string]: number;
}): Array<TextAndCount> {
  return Object.entries(packageAttributesAndCounts)
    .map(([attributeName, count]) => ({
      text: attributeName,
      count,
    }))
    .sort(compareTextAndCount);
}

function compareTextAndCount(
  textAndCount: TextAndCount,
  otherTextAndCount: TextAndCount
): number {
  if (textAndCount.count !== otherTextAndCount.count) {
    return otherTextAndCount.count - textAndCount.count;
  } else {
    return textAndCount.text.toLowerCase() <
      otherTextAndCount.text.toLowerCase()
      ? -1
      : 1;
  }
}

function getWizardListItems(
  packageAttributesWithCounts: Array<TextAndCount>,
  totalAttributeCount: number,
  idPrefix: string
): Array<ListWithAttributesItem> {
  return packageAttributesWithCounts.map((packageAttributeAndCount) =>
    getWizardListItem(packageAttributeAndCount, totalAttributeCount, idPrefix)
  );
}

function getWizardListItem(
  packageAttributeAndCount: TextAndCount,
  totalAttributeCount: number,
  idPrefix: string
): ListWithAttributesItem {
  const count = packageAttributeAndCount.count;
  const packageAttribute = packageAttributeAndCount.text;
  return {
    text: packageAttribute,
    id: `${idPrefix}-${packageAttribute}`,
    attributes: [
      {
        text: getCountText(count, totalAttributeCount),
        id: `${idPrefix}-attribute-${packageAttribute}`,
      },
    ],
  };
}

function getCountText(count: number, totalAttributeCount: number): string {
  const percentage = (count / totalAttributeCount) * 100;
  return percentage < 1
    ? `${count} (< 1%)`
    : `${count} (${percentage.toFixed(0)}%)`;
}

export function getAttributionWizardPackageVersionListItems(
  packageName: string,
  packageNamesToVersions: { [name: string]: Set<string> }
): Array<ListWithAttributesItem> {
  const packageVersionsToNames: { [version: string]: Set<string> } = {};
  for (const [name, versions] of Object.entries(packageNamesToVersions)) {
    for (const version of versions) {
      packageVersionsToNames[version] ??
        (packageVersionsToNames[version] = new Set<string>());
      packageVersionsToNames[version].add(name);
    }
  }

  const versions = Array.from(packageNamesToVersions[packageName]).sort();
  const packageVersionListItems: Array<ListWithAttributesItem> = [];
  for (const version of versions) {
    packageVersionListItems.push({
      text: version,
      id: `version-${version}`,
      attributes: Array.from(packageVersionsToNames[version])
        .sort()
        .map((packageName) => ({
          text: `${packageName}`,
          id: `version-${version}-name-${packageName}`,
        })),
    });
  }
  return packageVersionListItems;
}

export function getHighlightedPackageNameIds(
  selectedPackageName: string,
  packageNamesToVersions: { [packageName: string]: Set<string> }
): Array<string> {
  return Array.from(packageNamesToVersions[selectedPackageName]).map(
    (version) => `version-${version}-name-${selectedPackageName}`
  );
}

export function filterForPackageAttributeId(
  selectedPackageAttributeId: string,
  packageAttributes: Array<ListWithAttributesItem>
): string {
  return selectedPackageAttributeId !== ''
    ? packageAttributes.filter(
        (item) => item.id === selectedPackageAttributeId
      )[0].text
    : '';
}
