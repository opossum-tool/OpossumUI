// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  Criticality,
  PackageInfo,
} from '../../shared/shared-types';
import { text } from '../../shared/text';
import { Sorting } from '../shared-constants';
import { getCardLabels } from './get-card-labels';

const DEFAULT_NAME = '\u10FFFF'; // largest unicode character

export function getPackageSorter(
  displayPackageInfos: Attributions,
  sorting: Sorting,
) {
  return function (id1: string, id2: string): number {
    const p1 = displayPackageInfos[id1] as PackageInfo | undefined;
    const p2 = displayPackageInfos[id2] as PackageInfo | undefined;

    if (!p1 && !p2) {
      return 0;
    } else if (!p1) {
      return 1;
    } else if (!p2) {
      return -1;
    }

    if (
      sorting === text.sortings.criticality &&
      p1.criticality !== p2.criticality
    ) {
      return (
        getNumericalCriticalityValue(p2.criticality) -
        getNumericalCriticalityValue(p1.criticality)
      );
    }

    if (sorting === text.sortings.occurrence && p1.count !== p2.count) {
      return (p2.count ?? 0) - (p1.count ?? 0);
    }

    return compareAlphabeticalStrings(
      getElementTitle(getCardLabels(p1)),
      getElementTitle(getCardLabels(p2)),
    );
  };
}

export function compareAlphabeticalStrings(
  element: string,
  otherElement: string,
): number {
  const trimmedElement = element.trim();
  const trimmedOtherElement = otherElement.trim();

  const elementIsAlphabetical = isElementTitleAlphabetical(trimmedElement);
  const otherElementIsAlphabetical =
    isElementTitleAlphabetical(trimmedOtherElement);

  if (!elementIsAlphabetical && otherElementIsAlphabetical) {
    return 1;
  }
  if (elementIsAlphabetical && !otherElementIsAlphabetical) {
    return -1;
  }

  return trimmedElement.toLowerCase() < trimmedOtherElement.toLowerCase()
    ? -1
    : 1;
}

function getElementTitle(elementCardLabels: Array<string>): string {
  return elementCardLabels[0] ?? DEFAULT_NAME;
}

// item is alphabetical if starts with a letter. Empty attributions are to be sorted to the end of the list.
function isElementTitleAlphabetical(elementTitle: string): boolean {
  return elementTitle.toLowerCase() >= 'a' && elementTitle !== DEFAULT_NAME;
}

export function getNumericalCriticalityValue(
  criticality: Criticality | undefined,
) {
  switch (criticality) {
    case Criticality.High:
      return 2;
    case Criticality.Medium:
      return 1;
    default:
      return 0;
  }
}
