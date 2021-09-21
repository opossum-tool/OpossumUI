// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Attributions } from '../../shared/shared-types';

export function getAlphabeticalComparer(attributions: Attributions) {
  return function compareFunction(
    element: string,
    otherElement: string
  ): number {
    const defaultName = '\u10FFFF'; // largest unicode character
    const packageName = attributions[element].packageName || defaultName;
    const otherPackageName =
      attributions[otherElement].packageName || defaultName;
    return packageName.localeCompare(otherPackageName, undefined, {
      sensitivity: 'base',
    });
  };
}
