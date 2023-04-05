// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  Attributions,
  AttributionsToHashes,
  AttributionsToResources,
  PackageInfo,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../../shared/shared-types';
import isEqual from 'lodash/isEqual';
import { getParents } from './get-parents';
import {
  _addParentsToResourcesWithAttributedChildrenNoMutation,
  deleteChildrenFromAttributedResources,
} from './save-action-helpers';
import objectHash from 'object-hash';

export function getMatchingAttributionId(
  packageInfoToMatch: PackageInfo,
  attributions: Attributions
): string {
  return (
    Object.keys(attributions).find((id) =>
      isEqual(attributions[id], packageInfoToMatch)
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
  resourceIds: Array<string>
): void {
  resourceIds.forEach((resourceId) => {
    deleteChildrenFromAttributedResources(
      resourcesWithAttributedChildren,
      resourceId
    );
  });
}

export function createExternalAttributionsToHashes(
  externalAttributions: Attributions
): AttributionsToHashes {
  const excludeKeys = function (key: string): boolean {
    return [
      'comment',
      'attributionConfidence',
      'originIds',
      'preSelected',
    ].includes(key);
  };
  const hashOptions = {
    excludeKeys,
  };

  const externalAttributionsToHashes: AttributionsToHashes = {};
  const hashesToExternalAttributions: { [hash: string]: Array<string> } = {};

  for (const [attributionId, attribution] of Object.entries(
    externalAttributions
  )) {
    if (attribution.firstParty || attribution.packageName) {
      const attributionKeys = Object.keys(attribution) as Array<
        keyof PackageInfo
      >;
      attributionKeys.forEach(
        (key) =>
          (attribution[key] == null || attribution[key] === '') &&
          delete attribution[key]
      );

      const hash = objectHash(attribution, hashOptions);

      hashesToExternalAttributions[hash]
        ? hashesToExternalAttributions[hash].push(attributionId)
        : (hashesToExternalAttributions[hash] = [attributionId]);
    }
  }

  Object.entries(hashesToExternalAttributions).forEach(
    ([hash, attributionIds]) => {
      if (attributionIds.length > 1) {
        attributionIds.forEach(
          (attributionId) =>
            (externalAttributionsToHashes[attributionId] = hash)
        );
      }
    }
  );

  return externalAttributionsToHashes;
}
