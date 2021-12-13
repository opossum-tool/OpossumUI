// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Attributions } from '../../shared/shared-types';
import { getCardLabels } from './get-card-labels';

export function getAlphabeticalComparer(attributions: Attributions) {
  return function compareFunction(
    element: string,
    otherElement: string
  ): number {
    const defaultName = '\u10FFFF'; // largest unicode character

    const elementCardLabels = getCardLabels({
      id: element,
      name: attributions[element].packageName,
      ...attributions[element],
    });
    const elementTitle = getElementTitle(elementCardLabels, defaultName);
    const elementTitleIsAlphabetical = isElementTitleAlphabetical(
      elementTitle,
      defaultName
    );

    const otherElementCardLabels = getCardLabels({
      id: otherElement,
      name: attributions[otherElement].packageName,
      ...attributions[otherElement],
    });
    const otherElementTitle = getElementTitle(
      otherElementCardLabels,
      defaultName
    );
    const otherElementTitleIsAlphabetical = isElementTitleAlphabetical(
      otherElementTitle,
      defaultName
    );

    if (!elementTitleIsAlphabetical && otherElementTitleIsAlphabetical)
      return 1;
    if (elementTitleIsAlphabetical && !otherElementTitleIsAlphabetical)
      return -1;

    return elementTitle.localeCompare(otherElementTitle, undefined, {
      sensitivity: 'base',
    });
  };
}

function getElementTitle(
  elementCardLabels: Array<string>,
  defaultName: string
): string {
  return elementCardLabels.length > 0 ? elementCardLabels[0] : defaultName;
}

function isElementTitleAlphabetical(
  elementTitle: string,
  defaultName: string
): boolean {
  return elementTitle.localeCompare('a') >= 0 && elementTitle !== defaultName;
}
