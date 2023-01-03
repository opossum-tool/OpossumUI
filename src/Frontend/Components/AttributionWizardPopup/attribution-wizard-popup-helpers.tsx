// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionIdWithCount,
  Attributions,
} from '../../../shared/shared-types';
import { ListWithAttributesItem } from '../../types/types';
import { shouldNotBeCalled } from '../../util/should-not-be-called';

interface TextAndCount {
  text: string;
  count: number;
}

interface NamesWithCounts {
  [name: string]: number;
}

export function getAttributionWizardPackageListsItems(
  containedExternalPackages: Array<AttributionIdWithCount>,
  externalAttributions: Attributions
): {
  attributedPackageNamespaces: Array<ListWithAttributesItem>;
  attributedPackageNames: Array<ListWithAttributesItem>;
} {
  const totalAttributionCount = containedExternalPackages
    .map(
      (containedExternalPackage) =>
        containedExternalPackage.childrenWithAttributionCount ?? 0
    )
    .reduce(
      (accumulatedCounts, currentCount) => accumulatedCounts + currentCount,
      0
    );

  const packageNamespacesAndCounts = getPackageAttributesAndCounts(
    containedExternalPackages,
    externalAttributions,
    'namespace'
  );
  const packageNamesAndCounts = getPackageAttributesAndCounts(
    containedExternalPackages,
    externalAttributions,
    'name'
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
  };
}

function getPackageAttributesAndCounts(
  containedExternalPackages: Array<AttributionIdWithCount>,
  externalAttributions: Attributions,
  packageAttributeId: 'namespace' | 'name'
): NamesWithCounts {
  const packageAttributesAndCounts: NamesWithCounts = {};
  for (const containedExternalPackage of containedExternalPackages) {
    const packageInfo =
      externalAttributions[containedExternalPackage.attributionId];
    const packageCount =
      containedExternalPackage.childrenWithAttributionCount ?? 0;

    let packageAttribute: string;
    if (packageAttributeId === 'namespace') {
      packageAttribute =
        packageInfo.packageNamespace !== ''
          ? packageInfo.packageNamespace ?? 'none'
          : 'empty';
    } else if (packageAttributeId === 'name') {
      packageAttribute =
        packageInfo.packageName !== ''
          ? packageInfo.packageName ?? 'none'
          : 'empty';
    } else {
      shouldNotBeCalled(packageAttributeId);
    }

    packageAttributesAndCounts[packageAttribute] =
      (packageAttributesAndCounts[packageAttribute] ?? 0) + packageCount;
  }

  return packageAttributesAndCounts;
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

function compareTextAndCount(a: TextAndCount, b: TextAndCount): number {
  if (a.count !== b.count) {
    return b.count - a.count;
  } else {
    return a.text.toLowerCase() < b.text.toLowerCase() ? -1 : 1;
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
        text: `count: ${count} (${((count / totalAttributeCount) * 100).toFixed(
          1
        )}%)`,
        id: `${idPrefix}-attribute-${packageAttribute}`,
      },
    ],
  };
}
