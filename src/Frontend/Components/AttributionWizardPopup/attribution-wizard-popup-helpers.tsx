// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { max } from 'lodash';
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
  const namespace = popupPackage.packageNamespace || '';
  const name = popupPackage.packageName || '';
  const version = popupPackage.packageVersion || '';

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
  externalAndManualAttributions: Attributions,
  manuallyAddedNamespaces: Array<string>,
  manuallyAddedNames: Array<string>,
  manuallyAddedVersions: Array<string>,
  selectedPackageNamespaceId: string,
  selectedPackageNameId: string
): {
  sortedAttributedPackageNamespacesWithManuallyAddedOnes: Array<ListWithAttributesItem>;
  sortedAttributedPackageNamesWithManuallyAddedOnes: Array<ListWithAttributesItem>;
  sortedAttributedPackageVersionsWithManuallyAddedOnes: Array<ListWithAttributesItem>;
  selectedPackageNamespace: string;
  selectedPackageName: string;
  highlightedPackageNameIds: Array<string>;
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

  const sortedPackageNamespacesAndCounts = sortPackageAttributesAndCounts(
    packageNamespacesAndCounts
  );
  const sortedPackageNamesAndCounts = sortPackageAttributesAndCounts(
    packageNamesAndCounts
  );

  const sortedAttributedPackageNamespaces = getWizardListItems(
    sortedPackageNamespacesAndCounts,
    totalAttributionCount,
    'namespace'
  );
  const sortedAttributedPackageNames = getWizardListItems(
    sortedPackageNamesAndCounts,
    totalAttributionCount,
    'name'
  );

  const sortedAttributedPackageNamespacesWithManuallyAddedOnes =
    concatenatePackageAttributesWithManuallyAddedOnes(
      manuallyAddedNamespaces,
      sortedAttributedPackageNamespaces,
      'namespace'
    );
  const sortedAttributedPackageNamesWithManuallyAddedOnes =
    concatenatePackageAttributesWithManuallyAddedOnes(
      manuallyAddedNames,
      sortedAttributedPackageNames,
      'name'
    );

  const selectedPackageNamespace = filterForPackageAttributeId(
    selectedPackageNamespaceId,
    sortedAttributedPackageNamespacesWithManuallyAddedOnes
  );
  const selectedPackageName = filterForPackageAttributeId(
    selectedPackageNameId,
    sortedAttributedPackageNamesWithManuallyAddedOnes
  );

  const packageNamesToVersions = getPackageNamesToVersions(
    externalAndManualAttributionIdsWithCounts,
    externalAndManualAttributions
  );
  const attributedPackageVersions = getAttributionWizardPackageVersionListItems(
    packageNamesToVersions
  );
  const packageNameWasManuallyAdded =
    selectedPackageName in packageNamesToVersions;
  const highlightedPackageNameIds = packageNameWasManuallyAdded
    ? getHighlightedPackageNameIds(selectedPackageName, packageNamesToVersions)
    : [];
  const sortedAttributedPackageVersions = sortAttributedPackageVersions(
    attributedPackageVersions,
    highlightedPackageNameIds
  );
  const sortedAttributedPackageVersionsWithManuallyAddedOnes =
    concatenatePackageAttributesWithManuallyAddedOnes(
      manuallyAddedVersions,
      sortedAttributedPackageVersions,
      'version'
    );

  return {
    sortedAttributedPackageNamespacesWithManuallyAddedOnes,
    sortedAttributedPackageNamesWithManuallyAddedOnes,
    sortedAttributedPackageVersionsWithManuallyAddedOnes,
    selectedPackageNamespace,
    selectedPackageName,
    highlightedPackageNameIds,
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
      packageAttribute = packageInfo.packageNamespace || '';
    } else if (packageAttributeId === 'name') {
      packageAttribute = packageInfo.packageName || '';
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

    const packageName = packageInfo.packageName || '';
    const packageVersion = packageInfo.packageVersion || '';

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

export function getAttributionWizardPackageVersionListItems(packageNamesToVersions: {
  [name: string]: Set<string>;
}): Array<ListWithAttributesItem> {
  const packageVersionsToNames: { [version: string]: Set<string> } = {};
  for (const [name, versions] of Object.entries(packageNamesToVersions)) {
    for (const version of versions) {
      packageVersionsToNames[version] ??
        (packageVersionsToNames[version] = new Set<string>());
      packageVersionsToNames[version].add(name);
    }
  }

  const versions = Object.keys(packageVersionsToNames).sort();
  const attributedPackageVersions: Array<ListWithAttributesItem> = [];
  for (const version of versions) {
    attributedPackageVersions.push({
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

  return attributedPackageVersions;
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

export function concatenatePackageAttributesWithManuallyAddedOnes(
  manuallyAddedAttributes: Array<string>,
  packageAttributes: Array<ListWithAttributesItem>,
  attributeId: 'namespace' | 'name' | 'version'
): Array<ListWithAttributesItem> {
  return [
    ...convertManuallyAddedListEntriesToListItems(
      manuallyAddedAttributes,
      attributeId
    ),
    ...packageAttributes,
  ];
}

export function convertManuallyAddedListEntriesToListItems(
  manuallyAddedListEntries: Array<string>,
  packageAttributeId: string
): Array<ListWithAttributesItem> {
  return manuallyAddedListEntries.map((item) => ({
    text: item,
    id: `${packageAttributeId}-${item}`,
    manuallyAdded: true,
    attributes: undefined,
  }));
}

export function sortAttributedPackageVersions(
  attributedPackageVersions: Array<ListWithAttributesItem>,
  highlightedPackageNameIds: Array<string>
): Array<ListWithAttributesItem> {
  return attributedPackageVersions.sort(
    (attributedPackageVersionA, attributedPackageVersionB) =>
      compareVersionAttributeHighlighting(
        attributedPackageVersionA,
        attributedPackageVersionB,
        highlightedPackageNameIds
      )
  );
}

function compareVersionAttributeHighlighting(
  attributedPackageVersionA: ListWithAttributesItem,
  attributedPackageVersionB: ListWithAttributesItem,
  highlightedPackageNameIds: Array<string>
): number {
  const attributeIdsA = attributedPackageVersionA.attributes?.map(
    (attribute) => attribute.id
  );

  const attributeIdsB = attributedPackageVersionB.attributes?.map(
    (attribute) => attribute.id
  );

  let matchCounterA = 0;
  let matchCounterB = 0;
  for (const highlightedPackageNameId of highlightedPackageNameIds) {
    const highlightedPackageName = highlightedPackageNameId.split('-').at(-1);

    const numberOfMatchesA = attributeIdsA?.filter((attributeIdA) =>
      attributeIdA.match(new RegExp(`${highlightedPackageName}`, 'i'))
    ).length;
    matchCounterA += numberOfMatchesA ?? 0;

    const numberOfMatchesB = attributeIdsB?.filter((attributeIdB) =>
      attributeIdB.match(new RegExp(`${highlightedPackageName}`, 'i'))
    ).length;
    matchCounterB += numberOfMatchesB ?? 0;
  }

  return matchCounterB - matchCounterA !== 0
    ? matchCounterB - matchCounterA
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
    if (versionAPart - versionBPart !== 0) {
      return versionAPart - versionBPart;
    }
  }
  return 0;
}
