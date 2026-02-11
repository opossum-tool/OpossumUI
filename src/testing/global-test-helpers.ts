// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Resources } from '../shared/shared-types';

export function pathsToResources(paths: Array<string>) {
  const result: Resources = {};
  for (const path of paths) {
    let current = result;
    const names = path.split('/');

    // Ignore empty first string (because all paths start with /)
    // and last name, which is empty for directories
    for (const name of names.slice(1, -1)) {
      if (!(name in current) || current[name] === 1) {
        current[name] = {};
      }
      current = current[name];
    }

    const lastName = names.at(-1);
    if (lastName && lastName !== '') {
      current[lastName] = 1;
    }
  }

  return result;
}
