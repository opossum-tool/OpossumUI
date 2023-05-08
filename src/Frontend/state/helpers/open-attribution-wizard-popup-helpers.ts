// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  ResourcesToAttributions,
  Attributions,
  ResourcesWithAttributedChildren,
  DisplayPackageInfo,
} from '../../../shared/shared-types';
import { getAttributedChildren } from '../../util/get-attributed-children';
import { shouldNotBeCalled } from '../../util/should-not-be-called';
import { v4 as uuid4 } from 'uuid';
import { AttributionIdWithCount, PackageAttributes } from '../../types/types';

interface NamesWithCounts {
  [name: string]: number;
}

export function getAllAttributionIdsWithCountsFromResourceAndChildren(
  selectedResourceId: string,
  resourcesToExternalAttributions: ResourcesToAttributions,
  resourcesWithExternallyAttributedChildren: ResourcesWithAttributedChildren,
  resourcesToManualAttributions: ResourcesToAttributions,
  resourcesWithManuallyAttributedChildren: ResourcesWithAttributedChildren,
  resolvedExternalAttributions: Set<string>
): Array<AttributionIdWithCount> {
  const externalAttributedChildren: Set<string> = getAttributedChildren(
    resourcesWithExternallyAttributedChildren,
    selectedResourceId
  );
  if (selectedResourceId in resourcesToExternalAttributions) {
    externalAttributedChildren.add(selectedResourceId);
  }

  const manualAttributedChildren: Set<string> = getAttributedChildren(
    resourcesWithManuallyAttributedChildren,
    selectedResourceId
  );
  if (selectedResourceId in resourcesToManualAttributions) {
    manualAttributedChildren.add(selectedResourceId);
  }

  const externalAttributionsWithCounts = getAggregatedAttributionIdsAndCounts(
    resourcesToExternalAttributions,
    externalAttributedChildren,
    resolvedExternalAttributions
  );
  const manualAttributionsWithCounts = getAggregatedAttributionIdsAndCounts(
    resourcesToManualAttributions,
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

export function getAttributionWizardInitialState(
  externalAndManualAttributionIdsWithCounts: Array<AttributionIdWithCount>,
  externalAndManualAttributions: Attributions
): {
  packageNamespaces: PackageAttributes;
  packageNames: PackageAttributes;
  packageVersions: PackageAttributes;
  totalAttributionCount: number;
} {
  const totalAttributionCount = externalAndManualAttributionIdsWithCounts
    .map((attributionIdWithCount) => attributionIdWithCount.count ?? 0)
    .reduce(
      (accumulatedCounts, currentCount) => accumulatedCounts + currentCount,
      0
    );

  const packageNamespaces = getPackageAttributes(
    externalAndManualAttributionIdsWithCounts,
    externalAndManualAttributions,
    'namespace'
  );
  const packageNames = getPackageAttributes(
    externalAndManualAttributionIdsWithCounts,
    externalAndManualAttributions,
    'name'
  );

  const packageVersionsToNames = getPackageVersionsToNames(
    externalAndManualAttributionIdsWithCounts,
    externalAndManualAttributions
  );

  const packageVersions = getPackageVersionsWithRelatedPackageNameIds(
    packageVersionsToNames,
    packageNames
  );

  return {
    packageNamespaces,
    packageNames,
    packageVersions,
    totalAttributionCount,
  };
}

function getPackageAttributes(
  externalAndManualAttributionIdsWithCounts: Array<AttributionIdWithCount>,
  externalAndManualAttributions: Attributions,
  packageAttributeKey: 'namespace' | 'name'
): PackageAttributes {
  const packageAttributesAndCounts: NamesWithCounts = {};
  for (const attributionIdWithCount of externalAndManualAttributionIdsWithCounts) {
    const packageInfo =
      externalAndManualAttributions[attributionIdWithCount.attributionId];
    const packageCount = attributionIdWithCount.count ?? 0;

    let packageAttribute: string;
    if (packageAttributeKey === 'namespace') {
      packageAttribute = packageInfo.packageNamespace || '';
    } else if (packageAttributeKey === 'name') {
      packageAttribute = packageInfo.packageName || '';
    } else {
      shouldNotBeCalled(packageAttributeKey);
    }

    packageAttributesAndCounts[packageAttribute] =
      (packageAttributesAndCounts[packageAttribute] ?? 0) + packageCount;
  }

  const sortedPackageAttributes = Object.entries(
    packageAttributesAndCounts
  ).map(([attributeName, count]) => ({
    text: attributeName,
    count,
  }));

  return sortedPackageAttributes.reduce(
    (accumulatedAttributes, currentAttribute) => ({
      ...accumulatedAttributes,
      [uuid4()]: currentAttribute,
    }),
    {}
  );
}

function getPackageVersionsToNames(
  attributionIdsWithCounts: Array<AttributionIdWithCount>,
  attributions: Attributions
): { [version: string]: Set<string> } {
  const packageVersionsToNames: { [version: string]: Set<string> } = {};
  for (const attributionIdWithCount of attributionIdsWithCounts) {
    const packageInfo = attributions[attributionIdWithCount.attributionId];

    const packageName = packageInfo.packageName || '';
    const packageVersion = packageInfo.packageVersion || '';

    packageVersionsToNames[packageVersion] ??
      (packageVersionsToNames[packageVersion] = new Set<string>());
    packageVersionsToNames[packageVersion].add(packageName);
  }

  return packageVersionsToNames;
}

export function getPackageVersionsWithRelatedPackageNameIds(
  packageVersionsToNames: { [version: string]: Set<string> },
  packageNames: PackageAttributes
): PackageAttributes {
  const versions = Object.keys(packageVersionsToNames);
  const packageVersions: PackageAttributes = {};
  for (const version of versions) {
    const relatedPackageNames = packageVersionsToNames[version];

    const relatedPackageNameIds = new Set<string>(
      Object.entries(packageNames).flatMap(([uuid, textAndCount]) =>
        relatedPackageNames.has(textAndCount.text) ? [uuid] : []
      )
    );

    packageVersions[uuid4()] = {
      text: version,
      relatedIds: relatedPackageNameIds,
    };
  }

  return packageVersions;
}

export function getPreSelectedPackageAttributeIds(
  originalDisplayPackageInfo: DisplayPackageInfo,
  packageNamespaces: PackageAttributes,
  packageNames: PackageAttributes,
  packageVersions: PackageAttributes
): {
  preSelectedPackageNamespaceId: string;
  preSelectedPackageNameId: string;
  preSelectedPackageVersionId: string;
} {
  const namespace = originalDisplayPackageInfo.packageNamespace || '';
  const name = originalDisplayPackageInfo.packageName || '';
  const version = originalDisplayPackageInfo.packageVersion || '';

  const preSelectedPackageNamespaceId = Object.entries(
    packageNamespaces
  ).flatMap(([uuid, textAndCount]) =>
    textAndCount.text === namespace ? [uuid] : []
  )[0];
  const preSelectedPackageNameId = Object.entries(packageNames).flatMap(
    ([uuid, textAndCount]) => (textAndCount.text === name ? [uuid] : [])
  )[0];
  const preSelectedPackageVersionId = Object.entries(packageVersions).flatMap(
    ([uuid, textAndRelatedId]) =>
      textAndRelatedId.text === version ? [uuid] : []
  )[0];

  return {
    preSelectedPackageNamespaceId,
    preSelectedPackageNameId,
    preSelectedPackageVersionId,
  };
}
