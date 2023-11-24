// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Resources } from '../../../shared/shared-types';

export function splitResourceIdsToCurrentAndOtherFolder(
  allResourceIds: Array<string>,
  folderPath: string,
): {
  currentFolderResourceIds: Array<string>;
  otherFolderResourceIds: Array<string>;
} {
  const currentFolderResourceIds: Array<string> = [];
  const otherFolderResourceIds: Array<string> = [];

  allResourceIds.forEach((resourceId) => {
    resourceId.startsWith(folderPath)
      ? currentFolderResourceIds.push(resourceId)
      : otherFolderResourceIds.push(resourceId);
  });
  return {
    currentFolderResourceIds,
    otherFolderResourceIds,
  };
}

export function getResourcesFromResourcePaths(
  resourcePaths: Array<string>,
): Resources {
  const resources: Resources = {};
  for (const resourcePath of resourcePaths) {
    addPathToResources(resourcePath, resources);
  }

  return resources;
}

function addPathToResources(resourcePath: string, resources: Resources): void {
  const isFolder = resourcePath.endsWith('/');
  const resourcePathSplit = isFolder
    ? resourcePath.split('/').slice(1, -1)
    : resourcePath.split('/').slice(1);
  resourcePathSplit.reduce(
    (parent: Resources, childName: string, index: number) => {
      if (index === resourcePathSplit.length - 1) {
        parent[childName] = isFolder ? {} : 1;
      } else {
        parent[childName] = parent[childName] || {};
      }
      const returnValue = parent[childName];
      return returnValue !== 1 ? returnValue : {};
    },
    resources,
  );
}

export function getInitialExpandedIds(
  allResourceIds: Array<string>,
): Array<string> {
  const initialExpandedIdsSet = new Set<string>().add('/');
  for (const resourceId of allResourceIds) {
    const resourceIdParents = resourceId.split('/').slice(1, -1);
    for (let i = 0; i < resourceIdParents.length; i++) {
      initialExpandedIdsSet.add(
        `/${resourceIdParents.slice(0, i + 1).join('/')}/`,
      );
    }
  }
  const initialExpandedIds = Array.from(initialExpandedIdsSet);

  return initialExpandedIds;
}
