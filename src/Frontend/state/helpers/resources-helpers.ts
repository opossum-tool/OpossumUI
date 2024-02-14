// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { compact, get, set, trim } from 'lodash';

import { Resources } from '../../../shared/shared-types';
import { ROOT_PATH } from '../../shared-constants';
import { canResourceHaveChildren } from '../../util/can-resource-have-children';

export function getPathsFromResources(resources: Resources): Array<string> {
  return _getPathsFromResources(resources, ROOT_PATH);
}

function _getPathsFromResources(
  resources: Resources,
  parentPath: string,
): Array<string> {
  const paths = new Array<string>();
  Object.keys(resources).forEach((resourceName) => {
    const resource = resources[resourceName];
    const path = `${parentPath}${resourceName}${
      canResourceHaveChildren(resource) ? '/' : ''
    }`;
    paths.push(path);
    if (canResourceHaveChildren(resource)) {
      const newPaths = _getPathsFromResources(resource, path);
      // Do not replace with spread operator (can lead to stack overflow exception)
      newPaths.forEach((path) => {
        paths.push(path);
      });
    }
  });

  return paths;
}

export function getResourcesFromPaths(resourcePaths: Array<string>): Resources {
  return resourcePaths.reduce<Resources>((resources, resourcePath) => {
    const pathComponents = compact(trim(resourcePath, '/').split('/'));
    if (!get(resources, pathComponents)) {
      const isFolder = resourcePath.endsWith('/');
      set(resources, pathComponents, isFolder ? {} : 1);
    }
    return resources;
  }, {});
}

export function getInitialExpandedIds(
  resourceIds: Array<string>,
): Array<string> {
  const initialExpandedIdsSet = new Set<string>().add('/');
  for (const resourceId of resourceIds) {
    const resourceIdParents = resourceId.split('/').slice(1, -1);
    for (let i = 0; i < resourceIdParents.length; i++) {
      initialExpandedIdsSet.add(
        `/${resourceIdParents.slice(0, i + 1).join('/')}/`,
      );
    }
  }
  return Array.from(initialExpandedIdsSet);
}
