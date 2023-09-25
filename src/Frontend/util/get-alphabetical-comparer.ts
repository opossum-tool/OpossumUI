// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Attributions } from '../../shared/shared-types';
import { getCardLabels } from './get-card-labels';
import { convertPackageInfoToDisplayPackageInfo } from './convert-package-info';

const DEFAULT_NAME = '\u10FFFF'; // largest unicode character

export function getAlphabeticalComparerForAttributions(
  attributions: Attributions,
) {
  return function compareFunction(
    element: string,
    otherElement: string,
  ): number {
    const elementCardLabels = getCardLabels(
      convertPackageInfoToDisplayPackageInfo(
        {
          packageName: attributions[element].packageName,
          ...attributions[element],
        },
        [],
      ),
    );
    const elementTitle = getElementTitle(elementCardLabels);

    const otherElementCardLabels = getCardLabels(
      convertPackageInfoToDisplayPackageInfo(
        {
          packageName: attributions[otherElement].packageName,
          ...attributions[otherElement],
        },
        [],
      ),
    );
    const otherElementTitle = getElementTitle(otherElementCardLabels);

    return compareAlphabeticalStrings(elementTitle, otherElementTitle);
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

  if (!elementIsAlphabetical && otherElementIsAlphabetical) return 1;
  if (elementIsAlphabetical && !otherElementIsAlphabetical) return -1;

  return trimmedElement.toLowerCase() < trimmedOtherElement.toLowerCase()
    ? -1
    : 1;
}

function getElementTitle(elementCardLabels: Array<string>): string {
  return elementCardLabels.length > 0 ? elementCardLabels[0] : DEFAULT_NAME;
}

// item is alphabetical if starts with a letter. Empty attributions are to be sorted to the end of the list.
function isElementTitleAlphabetical(elementTitle: string): boolean {
  return elementTitle.toLowerCase() >= 'a' && elementTitle !== DEFAULT_NAME;
}
