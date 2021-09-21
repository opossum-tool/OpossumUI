// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Resources } from '../../../shared/shared-types';
import { canHaveChildren } from '../../util/can-have-children';

export function getPathsFromResources(resources: Resources): Array<string> {
  const paths = getPathsFromResourcesHelper(resources);
  paths.push('/');
  return paths;
}

function getPathsFromResourcesHelper(
  resources: Resources,
  parentPath = '/'
): Array<string> {
  const paths = new Array<string>();
  Object.keys(resources).forEach((resourceName) => {
    const resource: Resources | 1 = resources[resourceName];
    const path = `${parentPath}${resourceName}${
      canHaveChildren(resource) ? '/' : ''
    }`;
    paths.push(path);
    if (canHaveChildren(resource)) {
      const newPaths: string[] = getPathsFromResourcesHelper(resource, path);
      // Do not replace with spread operator (can lead to stack overflow exception)
      newPaths.forEach((path) => {
        paths.push(path);
      });
    }
  });

  return paths;
}
