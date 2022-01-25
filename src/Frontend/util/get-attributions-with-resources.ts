// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import get from 'lodash/get';

import {
  Attributions,
  AttributionsToResources,
  AttributionsWithResources,
  Resources,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import { PathPredicate } from '../types/types';
import {
  canResourceHaveChildren,
  isIdOfResourceWithChildren,
} from './can-resource-have-children';
import { removeTrailingSlashIfFileWithChildren } from './remove-trailing-slash-if-file-with-children';

export function getAttributionsWithResources(
  attributions: Attributions,
  attributionsToResources: AttributionsToResources
): AttributionsWithResources {
  return getAttributionsWithResourcePaths(
    attributions,
    attributionsToResources,
    getResources
  );
}

export function getAttributionsWithAllChildResourcesWithoutFolders(
  attributions: Attributions,
  attributionsToResources: AttributionsToResources,
  resourcesToAttributions: ResourcesToAttributions,
  resources: Resources,
  isAttributionBreakpoint: PathPredicate,
  isFileWithChildren: PathPredicate
): AttributionsWithResources {
  function getGetResourcesRecursively() {
    return (
      attributionsToResources: AttributionsToResources,
      attributionId: string
    ): Array<string> =>
      getResourcesRecursively(
        attributionsToResources[attributionId] || [],
        resources,
        resourcesToAttributions,
        isAttributionBreakpoint,
        isFileWithChildren
      );
  }

  return getAttributionsWithResourcePaths(
    attributions,
    attributionsToResources,
    getGetResourcesRecursively()
  );
}

function getAttributionsWithResourcePaths(
  attributions: Attributions,
  attributionsToResources: AttributionsToResources,
  getResources: (
    attributionsToResources: AttributionsToResources,
    attributionId: string
  ) => Array<string>
): AttributionsWithResources {
  const reducer = (
    attributionsWithResources: AttributionsWithResources,
    attributionId: string
  ): AttributionsWithResources => ({
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
  attributionId: string
): Array<string> {
  return attributionsToResources[attributionId] || [];
}

function getResourcesRecursively(
  resourcePaths: Array<string>,
  resources: Resources,
  resourcesToAttributions: ResourcesToAttributions,
  isAttributionBreakpoint: PathPredicate,
  isFileWithChildren: PathPredicate
): Array<string> {
  return resourcePaths.flatMap((path) => {
    if (isIdOfResourceWithChildren(path)) {
      const childPaths = getAllChildPathsOfFolder(
        path,
        getSubtree(resources, path),
        resourcesToAttributions,
        isAttributionBreakpoint,
        isFileWithChildren
      );
      return isFileWithChildren(path) ? childPaths.concat(path) : childPaths;
    } else {
      return [path];
    }
  });
}

function getSubtree(resourceTree: Resources, folderPath: string): Resources {
  if (folderPath === '/') {
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
  isAttributionBreakpoint: PathPredicate,
  isFileWithChildren: PathPredicate
): Array<string> {
  let childPaths: Array<string> = [];

  for (const directChild of Object.keys(childTree)) {
    const childSubtree = childTree[directChild];
    if (canResourceHaveChildren(childSubtree)) {
      const directChildPath = folderPath + directChild + '/';
      if (isAttributionBreakpoint(directChildPath)) {
        continue;
      }

      if (!Object.keys(resourcesToAttributions).includes(directChildPath)) {
        childPaths = childPaths.concat(
          getAllChildPathsOfFolder(
            directChildPath,
            childSubtree,
            resourcesToAttributions,
            isAttributionBreakpoint,
            isFileWithChildren
          )
        );
        if (isFileWithChildren(directChildPath)) {
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
  attributionsWithResources: AttributionsWithResources,
  isFileWithChildren: PathPredicate
): AttributionsWithResources {
  return Object.fromEntries(
    Object.entries(attributionsWithResources).map(([id, attributionInfo]) => {
      return [
        id,
        {
          ...attributionInfo,
          resources: attributionInfo.resources.map((path) =>
            removeTrailingSlashIfFileWithChildren(path, isFileWithChildren)
          ),
        },
      ];
    })
  );
}
