// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Resources } from '../../../shared/shared-types';
import { ROOT_PATH } from '../../shared-constants';
import { backend } from '../../util/backendClient';
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

export async function getInitialExpandedIds(
  attributionUuids: Array<string>,
  selectedResourceId: string,
): Promise<Array<string>> {
  return backend.getResourcePathsAndParentsForAttributions.query({
    attributionUuids,
    limit: EXPANSION_THRESHOLD,
    prioritizedResourcePath: selectedResourceId,
  });
}
