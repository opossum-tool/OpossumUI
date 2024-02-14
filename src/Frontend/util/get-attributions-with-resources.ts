// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import get from 'lodash/get';

import {
  Attributions,
  AttributionsToResources,
  Resources,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import { ROOT_PATH } from '../shared-constants';
import {
  canResourceHaveChildren,
  isIdOfResourceWithChildren,
} from './can-resource-have-children';

export function getAttributionsWithResources(
  attributions: Attributions,
  attributionsToResources: AttributionsToResources,
): Attributions {
  return getAttributionsWithResourcePaths(
    attributions,
    attributionsToResources,
    getResources,
  );
}

export function getAttributionsWithAllChildResourcesWithoutFolders(
  attributions: Attributions,
  attributionsToResources: AttributionsToResources,
  resourcesToAttributions: ResourcesToAttributions,
  resources: Resources,
  attributionBreakpoints: Set<string>,
  filesWithChildren: Set<string>,
): Attributions {
  function getGetResourcesRecursively() {
    return (
      attributionsToResources: AttributionsToResources,
      attributionId: string,
    ): Array<string> =>
      getResourcesRecursively(
        attributionsToResources[attributionId] || [],
        resources,
        resourcesToAttributions,
        attributionBreakpoints,
        filesWithChildren,
      );
  }

  return getAttributionsWithResourcePaths(
    attributions,
    attributionsToResources,
    getGetResourcesRecursively(),
  );
}

function getAttributionsWithResourcePaths(
  attributions: Attributions,
  attributionsToResources: AttributionsToResources,
  getResources: (
    attributionsToResources: AttributionsToResources,
    attributionId: string,
  ) => Array<string>,
): Attributions {
  const reducer = (
    attributionsWithResources: Attributions,
    attributionId: string,
  ): Attributions => ({
    ...attributionsWithResources,
    [attributionId]: {
      ...attributions[attributionId],
      resources: getResources(attributionsToResources, attributionId),
    },
  });

  return Object.keys(attributions).reduce(reducer, {});
}

function getResources(
  attributionsToResources: AttributionsToResources,
  attributionId: string,
): Array<string> {
  return attributionsToResources[attributionId] || [];
}

function getResourcesRecursively(
  resourcePaths: Array<string>,
  resources: Resources,
  resourcesToAttributions: ResourcesToAttributions,
  attributionBreakpoints: Set<string>,
  filesWithChildren: Set<string>,
): Array<string> {
  return resourcePaths.flatMap((path) => {
    if (isIdOfResourceWithChildren(path)) {
      const childPaths = getAllChildPathsOfFolder(
        path,
        getSubtree(resources, path),
        resourcesToAttributions,
        attributionBreakpoints,
        filesWithChildren,
      );
      return filesWithChildren.has(path) ? childPaths.concat(path) : childPaths;
    }
    return [path];
  });
}

export function getSubtree(
  resourceTree: Resources,
  folderPath: string,
): Resources {
  if (folderPath === ROOT_PATH) {
    return resourceTree;
  }

  const pathElements = folderPath
    .split('/')
    .filter((pathElement) => Boolean(pathElement));

  return get(resourceTree, pathElements);
}

function getAllChildPathsOfFolder(
  folderPath: string,
  childTree: Resources,
  resourcesToAttributions: ResourcesToAttributions,
  attributionBreakpoints: Set<string>,
  filesWithChildren: Set<string>,
): Array<string> {
  let childPaths: Array<string> = [];

  for (const directChild of Object.keys(childTree)) {
    const childSubtree = childTree[directChild];
    if (canResourceHaveChildren(childSubtree)) {
      const directChildPath = `${folderPath + directChild}/`;
      if (attributionBreakpoints.has(directChildPath)) {
        continue;
      }

      if (!Object.keys(resourcesToAttributions).includes(directChildPath)) {
        childPaths = childPaths.concat(
          getAllChildPathsOfFolder(
            directChildPath,
            childSubtree,
            resourcesToAttributions,
            attributionBreakpoints,
            filesWithChildren,
          ),
        );
        if (filesWithChildren.has(directChildPath)) {
          childPaths.push(directChildPath);
        }
      }
    } else {
      const directChildPath = folderPath + directChild;

      if (!Object.keys(resourcesToAttributions).includes(directChildPath)) {
        childPaths.push(directChildPath);
      }
    }
  }

  return childPaths;
}

export function removeSlashesFromFilesWithChildren(
  attributionsWithResources: Attributions,
  filesWithChildren: Set<string>,
): Attributions {
  return Object.fromEntries(
    Object.entries(attributionsWithResources).map(([id, attributionInfo]) => {
      return [
        id,
        {
          ...attributionInfo,
          resources: attributionInfo.resources?.map((path) =>
            filesWithChildren.has(path) ? path.replace(/\/$/, '') : path,
          ),
        },
      ];
    }),
  );
}
