// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  Attributions,
  AttributionsToResources,
  PackageInfo,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../../shared/shared-types';
import { getParents } from './get-parents';
import {
  _addParentsToResourcesWithAttributedChildrenNoMutation,
  attributionsAreEqual,
  deleteChildrenFromAttributedResources,
} from './save-action-helpers';

export function getMatchingAttributionId(
  packageInfoToMatch: PackageInfo,
  attributions: Attributions
): string {
  return (
    Object.keys(attributions).find((id) =>
      attributionsAreEqual(attributions[id], packageInfoToMatch)
    ) || ''
  );
}

export function computeChildrenWithAttributions(
  resourcesToAttributions: ResourcesToAttributions
): ResourcesWithAttributedChildren {
  const childrenWithAttributions = {};
  for (const path of Object.keys(resourcesToAttributions)) {
    _addParentsToResourcesWithAttributedChildren(
      path,
      childrenWithAttributions
    );
  }

  return childrenWithAttributions;
}

export function _addParentsToResourcesWithAttributedChildren(
  attributedPath: string,
  childrenWithAttributions: ResourcesWithAttributedChildren
): void {
  getParents(attributedPath).forEach((parent) => {
    if (!(parent in childrenWithAttributions)) {
      childrenWithAttributions[parent] = new Set();
    }

    childrenWithAttributions[parent].add(attributedPath);
  });
}

export function getAttributionDataFromSetAttributionDataPayload(payload: {
  attributions: Attributions;
  resourcesToAttributions: ResourcesToAttributions;
}): AttributionData {
  return {
    attributions: payload.attributions,
    resourcesToAttributions: payload.resourcesToAttributions,
    attributionsToResources: getAttributionsToResources(
      payload.resourcesToAttributions
    ),
    resourcesWithAttributedChildren: computeChildrenWithAttributions(
      payload.resourcesToAttributions
    ),
  };
}

function getAttributionsToResources(
  resourcesToAttributions: ResourcesToAttributions
): AttributionsToResources {
  const attributionsToResources: AttributionsToResources = {};

  for (const resource of Object.keys(resourcesToAttributions)) {
    for (const attribution of resourcesToAttributions[resource]) {
      if (attributionsToResources[attribution]) {
        attributionsToResources[attribution].push(resource);
      } else {
        attributionsToResources[attribution] = [resource];
      }
    }
  }

  return attributionsToResources;
}

export function addUnresolvedAttributionsToResourcesWithAttributedChildren(
  resourcesWithAttributedChildren: ResourcesWithAttributedChildren,
  paths: Array<string>
): ResourcesWithAttributedChildren {
  paths.forEach((path) => {
    _addParentsToResourcesWithAttributedChildrenNoMutation(
      path,
      resourcesWithAttributedChildren
    );
  });
  return resourcesWithAttributedChildren;
}

export function removeResolvedAttributionsFromResourcesWithAttributedChildren(
  resourcesWithAttributedChildren: ResourcesWithAttributedChildren,
  resourceIds: string[]
): void {
  resourceIds.forEach((resourceId) => {
    deleteChildrenFromAttributedResources(
      resourcesWithAttributedChildren,
      resourceId
    );
  });
}
