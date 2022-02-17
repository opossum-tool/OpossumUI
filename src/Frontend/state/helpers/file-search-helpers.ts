// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Resources } from '../../../shared/shared-types';
import { canResourceHaveChildren } from '../../util/can-resource-have-children';

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
      canResourceHaveChildren(resource) ? '/' : ''
    }`;
    paths.push(path);
    if (canResourceHaveChildren(resource)) {
      const newPaths: Array<string> = getPathsFromResourcesHelper(
        resource,
        path
      );
      // Do not replace with spread operator (can lead to stack overflow exception)
      newPaths.forEach((path) => {
        paths.push(path);
      });
    }
  });

  return paths;
}
