// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { max } from 'lodash';

import { ListWithAttributesItem } from '../../types/types';

export function sortAttributedPackageVersions(
  attributedPackageVersions: Array<ListWithAttributesItem>,
  highlightedPackageNameIds: Array<string>,
): Array<ListWithAttributesItem> {
  return attributedPackageVersions.sort(
    (attributedPackageVersionA, attributedPackageVersionB) =>
      compareVersionAttributeHighlighting(
        attributedPackageVersionA,
        attributedPackageVersionB,
        highlightedPackageNameIds,
      ),
  );
}

function compareVersionAttributeHighlighting(
  attributedPackageVersionA: ListWithAttributesItem,
  attributedPackageVersionB: ListWithAttributesItem,
  highlightedPackageNameIds: Array<string>,
): number {
  const manuallyAddedA = Boolean(attributedPackageVersionA.manuallyAdded);
  const manuallyAddedB = Boolean(attributedPackageVersionB.manuallyAdded);

  if (manuallyAddedA !== manuallyAddedB) {
    return manuallyAddedA ? -1 : 1;
  }
  if (manuallyAddedA && manuallyAddedB) {
    const textA = attributedPackageVersionA.text;
    const textB = attributedPackageVersionB.text;
    return textA.toLowerCase() < textB.toLowerCase() ? -1 : 1;
  }

  const attributeIdsA = attributedPackageVersionA.attributes?.map(
    (attribute) => attribute.id,
  );
  const attributeIdsB = attributedPackageVersionB.attributes?.map(
    (attribute) => attribute.id,
  );

  const numMatchesA =
    attributeIdsA?.filter((attributeIdA) =>
      attributeIdA !== undefined
        ? highlightedPackageNameIds.includes(attributeIdA)
        : false,
    ).length ?? 0;
  const numMatchesB =
    attributeIdsB?.filter((attributeIdB) =>
      attributeIdB !== undefined
        ? highlightedPackageNameIds.includes(attributeIdB)
        : false,
    ).length ?? 0;

  return numMatchesA !== numMatchesB
    ? numMatchesB - numMatchesA
    : compareSemanticVersion(
        attributedPackageVersionA.text,
        attributedPackageVersionB.text,
      );
}

function compareSemanticVersion(versionA: string, versionB: string): number {
  const versionAIsValid = versionA.match(/^\d+(\.\d+)*$/);
  const versionBIsValid = versionB.match(/^\d+(\.\d+)*$/);

  if (!versionAIsValid && !versionBIsValid) {
    return compareAlphabetically(versionA, versionB);
  }
  if (!versionAIsValid || !versionBIsValid) {
    return !versionAIsValid ? 1 : -1;
  }

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
      return isNaN(versionAPart) ? -1 : 1;
    }

    if (versionAPart - versionBPart !== 0) {
      return versionAPart - versionBPart;
    }
  }
  return 0;
}

function compareAlphabetically(versionA: string, versionB: string): number {
  return versionA.toLowerCase() < versionB.toLowerCase() ? -1 : 1;
}
