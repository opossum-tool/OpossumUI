// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ListWithAttributesItem } from '../../types/types';

export function sortAttributedPackageItems(
  attributedPackageItems: Array<ListWithAttributesItem>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  highlightedPackageNameIds: Array<string>
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
