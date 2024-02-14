// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export function getParents(pathToBeSplit: string): Array<string> {
  const parents: Array<string> = [];
  for (
    let characterIndex = 0;
    characterIndex < pathToBeSplit.length - 1;
    characterIndex++
  ) {
    if (pathToBeSplit[characterIndex] === '/') {
      parents.push(pathToBeSplit.slice(0, characterIndex + 1));
    }
  }
  return parents;
}

export function getParentsUpToNextAttributionBreakpoint(
  path: string,
  attributionBreakpoints: Set<string>,
): Array<string> {
  // A breakpoint has no parents.
  if (attributionBreakpoints.has(path)) {
    return [];
  }

  const allParents = getParents(path);
  for (let idx = allParents.length - 1; idx >= 0; --idx) {
    if (attributionBreakpoints.has(allParents[idx])) {
      return allParents.slice(idx + 1);
    }
  }
  return allParents;
}
