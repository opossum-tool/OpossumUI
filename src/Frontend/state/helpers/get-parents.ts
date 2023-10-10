// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PathPredicate } from '../../types/types';

export function getParents(pathToBeSplit: string): Array<string> {
  const parents: Array<string> = [];
  for (
    let characterIndex = 0;
    characterIndex < pathToBeSplit.length - 1;
    characterIndex++
  ) {
    if (pathToBeSplit[characterIndex] === '/')
      parents.push(pathToBeSplit.substr(0, characterIndex + 1));
  }
  return parents;
}

export function getParentsUpToNextAttributionBreakpoint(
  path: string,
  isAttributionBreakpoint: PathPredicate,
): Array<string> {
  // A breakpoint has no parents.
  if (isAttributionBreakpoint(path)) {
    return [];
  }

  const allParents = getParents(path);
  for (let idx = allParents.length - 1; idx >= 0; --idx) {
    if (isAttributionBreakpoint(allParents[idx])) {
      return allParents.slice(idx + 1);
    }
  }
  return allParents;
}
