// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Resources } from '../../../shared/shared-types';
import { ROOT_PATH } from '../../shared-constants';
import { canResourceHaveChildren } from '../../util/can-resource-have-children';

const EXPANSION_THRESHOLD = 1000;

export function getResourceIdsFromResources(
  resources: Resources,
  parentPath: string = ROOT_PATH,
): Array<string> {
  const paths: Array<string> = [];
  Object.keys(resources).forEach((resourceName) => {
    const resource = resources[resourceName];
    const path = `${parentPath}${resourceName}${
      canResourceHaveChildren(resource) ? '/' : ''
    }`;
    paths.push(path);
    if (canResourceHaveChildren(resource)) {
      const newPaths = getResourceIdsFromResources(resource, path);
      // Do not replace with spread operator (can lead to stack overflow exception)
      newPaths.forEach((path) => {
        paths.push(path);
      });
    }
  });

  return paths;
}

export function getResourcesFromIds(resourceIds: Array<string>): Resources {
  const resources: Resources = {};

  resourceIds.forEach((resourceId) => {
    const isFolder = resourceId.endsWith('/');
    const parts = resourceId.split('/').slice(1, isFolder ? -1 : undefined);
    let currentObj = resources;

    parts.forEach((part, index) => {
      if (!currentObj[part]) {
        currentObj[part] = index === parts.length - 1 && !isFolder ? 1 : {};
      }
      currentObj = currentObj[part] as Resources;
    });
  });

  return resources;
}

export function getInitialExpandedIds(
  resourceIds: Array<string>,
  selectedResourceId: string,
): Array<string> {
  const initialExpandedIdsSet = new Set<string>().add('/');
  for (const resourceId of [selectedResourceId, ...resourceIds].slice(
    0,
    EXPANSION_THRESHOLD,
  )) {
    const resourceIdParents = resourceId.split('/').slice(1, -1);
    for (let i = 0; i < resourceIdParents.length; i++) {
      initialExpandedIdsSet.add(
        `/${resourceIdParents.slice(0, i + 1).join('/')}/`,
      );
    }
  }
  return Array.from(initialExpandedIdsSet);
}
