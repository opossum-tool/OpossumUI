// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { isEmpty } from 'lodash';
import { Resources } from '../../../shared/shared-types';

export function filterOutAttributedResourcesConsideringSiblings(
  resourcesToFilter: Resources,
  attributedResourcesIds: Set<string>
): Resources {
  const [, filteredResources] = filterSubResources(
    resourcesToFilter,
    resourcesToFilter,
    '/',
    attributedResourcesIds
  );

  return filteredResources;
}

function filterSubResources(
  partiallyFilteredResources: Resources,
  currentResource: Resources,
  currentRoot: string,
  attributedResourceIds: Set<string>
): [boolean, Resources] {
  const childrenNames = Object.keys(currentResource);
  let allChildrenAreAttributed = true;
  for (const childName of childrenNames) {
    const childResource = currentResource[childName];
    if (childResource === 1) {
      allChildrenAreAttributed = handleFile(
        allChildrenAreAttributed,
        currentRoot,
        childName,
        attributedResourceIds
      );
    } else if (isEmpty(childResource)) {
      removePathFromResources(
        currentRoot + childName + '/',
        partiallyFilteredResources
      );
    } else {
      ({ allChildrenAreAttributed, partiallyFilteredResources } =
        handleFolderWithContent(
          currentRoot,
          childName,
          attributedResourceIds,
          allChildrenAreAttributed,
          partiallyFilteredResources,
          childResource
        ));
    }
  }

  if (allChildrenAreAttributed) {
    removePathFromResources(currentRoot, partiallyFilteredResources);
  }

  return [allChildrenAreAttributed, partiallyFilteredResources];
}

function handleFolderWithContent(
  currentRoot: string,
  childName: string,
  attributedResourceIds: Set<string>,
  allChildrenAreAttributed: boolean,
  partiallyFilteredResources: Resources,
  childResource: Resources
): {
  allChildrenAreAttributed: boolean;
  partiallyFilteredResources: Resources;
} {
  const folderResourceId = currentRoot + childName + '/';
  if (resourceIsAttributed(folderResourceId, attributedResourceIds)) {
    partiallyFilteredResources = handleAttributedFolder(
      partiallyFilteredResources,
      folderResourceId
    );
  } else {
    allChildrenAreAttributed = handleUnattributedFolder(
      partiallyFilteredResources,
      childResource,
      currentRoot,
      childName,
      attributedResourceIds,
      allChildrenAreAttributed
    );
  }
  return { allChildrenAreAttributed, partiallyFilteredResources };
}

function handleUnattributedFolder(
  partiallyFilteredResources: Resources,
  childResource: Resources,
  currentRoot: string,
  childName: string,
  attributedResourceIds: Set<string>,
  allChildrenAreAttributed: boolean
): boolean {
  let childsChildrenAreAttributed: boolean;
  [childsChildrenAreAttributed, partiallyFilteredResources] =
    filterSubResources(
      partiallyFilteredResources,
      childResource,
      currentRoot + childName + '/',
      attributedResourceIds
    );
  allChildrenAreAttributed =
    allChildrenAreAttributed && childsChildrenAreAttributed;
  return allChildrenAreAttributed;
}

function handleAttributedFolder(
  partiallyFilteredResources: Resources,
  folderResourceId: string
): Resources {
  removePathFromResources(folderResourceId, partiallyFilteredResources);
  return partiallyFilteredResources;
}

export function removePathFromResources(
  resourcePath: string,
  resources: Resources
): void {
  const isFolder = resourcePath.endsWith('/');
  const resourcePathSplit = isFolder
    ? resourcePath.split('/').slice(1, -1)
    : resourcePath.split('/').slice(1);
  const pathTail = resourcePathSplit.pop() ?? '';
  delete resourcePathSplit.reduce((parent: Resources, childName: string) => {
    const returnValue = parent[childName] || {};
    return returnValue !== 1 ? returnValue : {};
  }, resources)[pathTail];
}

function handleFile(
  allChildrenAreAttributed: boolean,
  currentRoot: string,
  childName: string,
  attributedResourceIds: Set<string>
): boolean {
  return (
    allChildrenAreAttributed &&
    isFileAttributed(currentRoot, childName, attributedResourceIds)
  );
}

function isFileAttributed(
  currentRoot: string,
  childName: string,
  attributedResourceIds: Set<string>
): boolean {
  return resourceIsAttributed(currentRoot + childName, attributedResourceIds);
}

function resourceIsAttributed(
  resourceId: string,
  attributedResourceIds: Set<string>
): boolean {
  return attributedResourceIds.has(resourceId);
}
