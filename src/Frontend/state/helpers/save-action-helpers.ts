// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { remove } from 'lodash';
import isEqual from 'lodash/isEqual';
import { v4 as uuid4 } from 'uuid';

import {
  AttributionData,
  AttributionsToResources,
  PackageInfo,
  ResourcesWithAttributedChildren,
} from '../../../shared/shared-types';
import { PathPredicate, State } from '../../types/types';
import { isIdOfResourceWithChildren } from '../../util/can-resource-have-children';
import { getClosestParentWithAttributions } from '../../util/get-closest-parent-attributions';
import {
  removeFromArrayCloneAndDeleteKeyFromObjectIfEmpty,
  removeFromSetCloneAndDeleteKeyFromObjectIfEmpty,
  replaceInArray,
} from '../../util/lodash-extension-utils';
import { getManualAttributions } from '../selectors/all-views-resource-selectors';
import { getParents } from './get-parents';

export type CalculatePreferredOverOriginIds = (
  pathToResource: string,
  newManualAttributionToResources: AttributionsToResources,
) => Array<string>;

export function createManualAttribution(
  manualData: AttributionData,
  selectedResourceId: string,
  strippedTemporaryDisplayPackageInfo: PackageInfo,
  calculatePreferredOverOriginIds: CalculatePreferredOverOriginIds,
): { newManualData: AttributionData; newAttributionId: string } {
  const newAttributionId = uuid4();

  const attributionIdsOfSelectedResource: Array<string> = manualData
    .resourcesToAttributions[selectedResourceId]
    ? [...manualData.resourcesToAttributions[selectedResourceId]]
    : [];
  attributionIdsOfSelectedResource.push(newAttributionId);

  const newManualData: AttributionData = {
    attributions: {
      ...manualData.attributions,
      [newAttributionId]: strippedTemporaryDisplayPackageInfo,
    },
    resourcesToAttributions: {
      ...manualData.resourcesToAttributions,
      [selectedResourceId]: attributionIdsOfSelectedResource,
    },
    attributionsToResources: {
      ...manualData.attributionsToResources,
      [newAttributionId]: [selectedResourceId],
    },
    resourcesWithAttributedChildren: {
      ...manualData.resourcesWithAttributedChildren,
    },
  };

  _addParentsToResourcesWithAttributedChildrenNoMutation(
    selectedResourceId,
    newManualData.resourcesWithAttributedChildren,
  );

  recalulatePreferencesOfParents(
    selectedResourceId,
    newManualData,
    calculatePreferredOverOriginIds,
  );

  return { newManualData, newAttributionId };
}

export function updateManualAttribution(
  attributionToUpdateId: string,
  manualData: AttributionData,
  strippedPackageInfo: PackageInfo,
): AttributionData {
  return {
    ...manualData,
    attributions: {
      ...manualData.attributions,
      [attributionToUpdateId]: strippedPackageInfo,
    },
  };
}

export function deleteManualAttribution(
  manualData: AttributionData,
  attributionToDeleteId: string,
  isAttributionBreakpoint: PathPredicate,
  calculatePreferredOverOriginIds: CalculatePreferredOverOriginIds,
): AttributionData {
  const newManualData: AttributionData =
    getAttributionDataShallowCopy(manualData);

  const resourcesLinkedToAttributionThatIsDeleted =
    manualData.attributionsToResources[attributionToDeleteId];
  delete newManualData.attributions[attributionToDeleteId];
  delete newManualData.attributionsToResources[attributionToDeleteId];

  resourcesLinkedToAttributionThatIsDeleted.forEach((resourceId) => {
    if (newManualData.resourcesToAttributions[resourceId].length > 1) {
      newManualData.resourcesToAttributions[resourceId] = [
        ...newManualData.resourcesToAttributions[resourceId],
      ];
      remove(
        newManualData.resourcesToAttributions[resourceId],
        (attributionId: string) => attributionId === attributionToDeleteId,
      );
    } else {
      delete newManualData.resourcesToAttributions[resourceId];
      deleteChildrenFromAttributedResources(
        newManualData.resourcesWithAttributedChildren,
        resourceId,
      );
    }
  });

  _removeAttributionsFromChildrenAndParents(
    newManualData,
    resourcesLinkedToAttributionThatIsDeleted,
    isAttributionBreakpoint,
  );

  resourcesLinkedToAttributionThatIsDeleted.forEach((resourceId) => {
    recalulatePreferencesOfParents(
      resourceId,
      newManualData,
      calculatePreferredOverOriginIds,
    );
  });

  return newManualData;
}

export function _removeAttributionsFromChildrenAndParents(
  newManualData: AttributionData,
  resourceIds: Array<string>,
  isAttributionBreakpoint: PathPredicate,
): void {
  for (const resourceId of resourceIds) {
    removeManualAttributionFromChildrenOfParentsIfInferable(
      newManualData,
      resourceId,
      isAttributionBreakpoint,
    );

    removeManualAttributionFromChildIfInferable(
      newManualData,
      resourceId,
      isAttributionBreakpoint,
    );
  }
}

export function deleteChildrenFromAttributedResources(
  resourcesWithAttributedChildren: ResourcesWithAttributedChildren,
  resourceId: string,
): ResourcesWithAttributedChildren {
  const resourceIndex: number =
    resourcesWithAttributedChildren.pathsToIndices[resourceId];

  getParents(resourceId).forEach((parentResource: string): void => {
    const parentIndex: number =
      resourcesWithAttributedChildren.pathsToIndices[parentResource];
    const childrenIndexes: Set<number> =
      resourcesWithAttributedChildren.attributedChildren[parentIndex];

    if (!childrenIndexes) {
    } else if (childrenIndexes.size === 1) {
      delete resourcesWithAttributedChildren.attributedChildren[parentIndex];
    } else {
      resourcesWithAttributedChildren.attributedChildren[parentIndex] = new Set(
        childrenIndexes,
      );
      resourcesWithAttributedChildren.attributedChildren[parentIndex].delete(
        resourceIndex,
      );
    }
  });

  return resourcesWithAttributedChildren;
}

export function unlinkResourceFromAttributionId(
  manualData: AttributionData,
  resourceId: string,
  attributionId: string,
  calculatePreferredOverOriginIds: CalculatePreferredOverOriginIds,
): AttributionData {
  const newManualData: AttributionData =
    getAttributionDataShallowCopy(manualData);

  removeFromArrayCloneAndDeleteKeyFromObjectIfEmpty(
    newManualData.resourcesToAttributions,
    resourceId,
    attributionId,
  );
  removeFromArrayCloneAndDeleteKeyFromObjectIfEmpty(
    newManualData.attributionsToResources,
    attributionId,
    resourceId,
  );

  if (!newManualData.resourcesToAttributions[resourceId]) {
    newManualData.resourcesWithAttributedChildren =
      deleteChildrenFromAttributedResources(
        newManualData.resourcesWithAttributedChildren,
        resourceId,
      );
  }

  recalulatePreferencesOfParents(
    resourceId,
    newManualData,
    calculatePreferredOverOriginIds,
  );

  return newManualData;
}

export function replaceAttributionWithMatchingAttributionId(
  manualData: AttributionData,
  matchingAttributionId: string,
  attributionToReplaceId: string,
  isAttributionBreakpoint: PathPredicate,
): AttributionData {
  const newManualData: AttributionData =
    getAttributionDataShallowCopy(manualData);

  replaceAndDeleteAttribution(
    newManualData,
    attributionToReplaceId,
    matchingAttributionId,
  );

  _removeManualAttributionFromChildrenIfAllAreIdentical(
    newManualData,
    newManualData.attributionsToResources[matchingAttributionId],
    isAttributionBreakpoint,
  );

  return newManualData;
}

function replaceAndDeleteAttribution(
  manualData: AttributionData,
  attributionToReplaceId: string,
  replacementAttributionId: string,
): void {
  const resourcesToRelink =
    manualData.attributionsToResources[attributionToReplaceId];

  resourcesToRelink.forEach((resourceId: string) => {
    manualData.resourcesToAttributions[resourceId] = [
      ...manualData.resourcesToAttributions[resourceId],
    ];

    if (
      manualData.resourcesToAttributions[resourceId].includes(
        replacementAttributionId,
      )
    ) {
      remove(
        manualData.resourcesToAttributions[resourceId],
        (attributionId: string) => attributionId === attributionToReplaceId,
      );
    } else {
      replaceInArray(
        manualData.resourcesToAttributions[resourceId],
        attributionToReplaceId,
        replacementAttributionId,
      );

      manualData.attributionsToResources[replacementAttributionId] = [
        ...manualData.attributionsToResources[replacementAttributionId],
      ];
      manualData.attributionsToResources[replacementAttributionId].push(
        resourceId,
      );
    }
  });

  delete manualData.attributionsToResources[attributionToReplaceId];
  delete manualData.attributions[attributionToReplaceId];
}

export function linkToAttributionManualData(
  manualData: AttributionData,
  selectedResourceId: string,
  matchingAttributionId: string,
  isAttributionBreakpoint: PathPredicate,
  calculatePreferredOverOriginIds: CalculatePreferredOverOriginIds,
): AttributionData {
  const newManualData: AttributionData =
    getAttributionDataShallowCopy(manualData);

  linkAttributionAndResource(
    newManualData,
    selectedResourceId,
    matchingAttributionId,
  );

  // _remove and _getIds functions must remain separated, because the _getIds logic cannot be
  // used in replaceAttributionWithMatchingAttributionId
  _removeManualAttributionFromChildrenIfAllAreIdentical(
    newManualData,
    _getIdsOfResourcesThatMightHaveChildrenWithTheSameAttributions(
      newManualData.attributionsToResources,
      selectedResourceId,
      matchingAttributionId,
    ),
    isAttributionBreakpoint,
  );

  recalulatePreferencesOfParents(
    selectedResourceId,
    newManualData,
    calculatePreferredOverOriginIds,
  );

  return newManualData;
}

function linkAttributionAndResource(
  newManualData: AttributionData,
  resourceId: string,
  attributionId: string,
): void {
  if (!newManualData.resourcesToAttributions[resourceId]) {
    newManualData.resourcesToAttributions[resourceId] = [];
  }

  if (
    !newManualData.resourcesToAttributions[resourceId].includes(attributionId)
  ) {
    newManualData.resourcesToAttributions[resourceId] = [
      ...newManualData.resourcesToAttributions[resourceId],
    ];
    newManualData.resourcesToAttributions[resourceId].push(attributionId);

    if (newManualData.attributionsToResources[attributionId]) {
      newManualData.attributionsToResources[attributionId] = [
        ...newManualData.attributionsToResources[attributionId],
      ];
      newManualData.attributionsToResources[attributionId].push(resourceId);
    } else {
      newManualData.attributionsToResources[attributionId] = [resourceId];
    }

    _addParentsToResourcesWithAttributedChildrenNoMutation(
      resourceId,
      newManualData.resourcesWithAttributedChildren,
    );
  }
}

export function recalulatePreferencesOfParents(
  pathToChangedResource: string,
  newManualData: AttributionData,
  calculatePreferredOverOriginIds: CalculatePreferredOverOriginIds,
): void {
  for (const pathToParent of getParents(pathToChangedResource)) {
    let wasPreferredParentFound = false;

    const manualAttributionsIds =
      newManualData.resourcesToAttributions[pathToParent] ?? [];

    manualAttributionsIds.forEach((manualAttributionId) => {
      const packageInfo = newManualData.attributions[manualAttributionId];
      if (packageInfo.preferred) {
        wasPreferredParentFound = true;
        packageInfo.preferredOverOriginIds = calculatePreferredOverOriginIds(
          pathToParent,
          newManualData.resourcesToAttributions,
        );
      }
    });

    if (wasPreferredParentFound) {
      break;
    }
  }
}

export function _addParentsToResourcesWithAttributedChildrenNoMutation(
  attributedPath: string,
  resourcesWithAttributedChildren: ResourcesWithAttributedChildren,
): void {
  const attributedPathIndex =
    addPathToIndexesIfMissingInResourcesWithAttributedChildren(
      resourcesWithAttributedChildren,
      attributedPath,
    );

  getParents(attributedPath).forEach((parent) => {
    const parentIndex =
      addPathToIndexesIfMissingInResourcesWithAttributedChildren(
        resourcesWithAttributedChildren,
        parent,
      );

    if (
      resourcesWithAttributedChildren.attributedChildren[parentIndex] ===
      undefined
    ) {
      resourcesWithAttributedChildren.attributedChildren[parentIndex] =
        new Set();
    } else {
      resourcesWithAttributedChildren.attributedChildren[parentIndex] = new Set(
        resourcesWithAttributedChildren.attributedChildren[parentIndex],
      );
    }

    resourcesWithAttributedChildren.attributedChildren[parentIndex].add(
      attributedPathIndex,
    );
  });
}

export function _getIdsOfResourcesThatMightHaveChildrenWithTheSameAttributions(
  attributionsToResources: AttributionsToResources,
  newlyLinkedResourceId: string,
  linkedAttribution: string,
): Array<string> {
  const resourcesLinkedToAttribution: Array<string> =
    attributionsToResources[linkedAttribution];
  let idsOfResourcesThatMightHaveParentsWithTheSameAttributions: Array<string> =
    getParents(newlyLinkedResourceId).filter((resourceId) =>
      resourcesLinkedToAttribution.includes(resourceId),
    );

  if (isIdOfResourceWithChildren(newlyLinkedResourceId)) {
    const childrenWithLinkedAttribution = resourcesLinkedToAttribution.filter(
      (resourceId) => resourceId.startsWith(newlyLinkedResourceId),
    );

    idsOfResourcesThatMightHaveParentsWithTheSameAttributions =
      idsOfResourcesThatMightHaveParentsWithTheSameAttributions.concat(
        childrenWithLinkedAttribution,
      );
  } else {
    idsOfResourcesThatMightHaveParentsWithTheSameAttributions.push(
      newlyLinkedResourceId,
    );
  }

  return idsOfResourcesThatMightHaveParentsWithTheSameAttributions;
}

export function _removeManualAttributionFromChildrenIfAllAreIdentical(
  manualData: AttributionData,
  idsOfChildrenWithPossiblyTheSameAttributions: Array<string>,
  isAttributionBreakpoint: PathPredicate,
): void {
  idsOfChildrenWithPossiblyTheSameAttributions.forEach((childId) => {
    removeManualAttributionFromChildIfInferable(
      manualData,
      childId,
      isAttributionBreakpoint,
    );
  });
}

function removeManualAttributionFromChildIfInferable(
  manualData: AttributionData,
  childId: string,
  isAttributionBreakpoint: PathPredicate,
): void {
  const closestParentWithAttribution = getClosestParentWithAttributions(
    childId,
    manualData.resourcesToAttributions,
    isAttributionBreakpoint,
  );

  if (!closestParentWithAttribution) {
    return;
  }

  if (
    resourcesHaveTheSameAttributions(
      closestParentWithAttribution,
      childId,
      manualData,
    )
  ) {
    const childAttributions: Array<string> =
      manualData.resourcesToAttributions[childId];

    childAttributions.forEach((attributionId: string) => {
      removeFromArrayCloneAndDeleteKeyFromObjectIfEmpty(
        manualData.attributionsToResources,
        attributionId,
        childId,
      );
    });

    delete manualData.resourcesToAttributions[childId];

    const idsOfParents: Array<string> = getParents(childId);
    idsOfParents.forEach((parentId: string) =>
      removeFromSetCloneAndDeleteKeyFromObjectIfEmpty(
        manualData.resourcesWithAttributedChildren.attributedChildren,
        manualData.resourcesWithAttributedChildren.pathsToIndices[parentId],
        manualData.resourcesWithAttributedChildren.pathsToIndices[childId],
      ),
    );
  }
}

function allAttributionsAreEqual(
  attributions: Array<PackageInfo>,
  otherAttributions: Array<PackageInfo>,
): boolean {
  const hasSameLength = attributions.length === otherAttributions.length;
  const allAttributionsAreInOtherAttributions = attributions.every(
    (attribution) =>
      otherAttributions.some((otherAttribution) =>
        isEqual(attribution, otherAttribution),
      ),
  );
  return hasSameLength && allAttributionsAreInOtherAttributions;
}

function resourcesHaveTheSameAttributions(
  firstResource: string,
  secondResource: string,
  manualData: AttributionData,
): boolean {
  const attributionIdsOfFirstResource =
    manualData.resourcesToAttributions[firstResource]?.sort() || [];
  const attributionIdsOfSecondResource =
    manualData.resourcesToAttributions[secondResource]?.sort() || [];
  const attributionsOfFirstResource = attributionIdsOfFirstResource.map(
    (id) => manualData.attributions[id],
  );
  const attributionsOfSecondResource = attributionIdsOfSecondResource.map(
    (id) => manualData.attributions[id],
  );
  return allAttributionsAreEqual(
    attributionsOfFirstResource,
    attributionsOfSecondResource,
  );
}

function removeManualAttributionFromChildrenOfParentsIfInferable(
  manualData: AttributionData,
  parentId: string,
  isAttributionBreakpoint: PathPredicate,
): void {
  // heuristic: restrict to children that share this attribution
  const firstAttributionId: string | undefined =
    manualData.resourcesToAttributions[parentId]?.[0];

  if (!firstAttributionId) {
    return;
  }

  const resourceLinkedToFirstAttributionIds: Array<string> =
    manualData.attributionsToResources[firstAttributionId];
  const childrenLinkedToNewAttributionIds: Array<string> =
    resourceLinkedToFirstAttributionIds.filter(
      (resourceId: string) =>
        resourceId.startsWith(parentId) && resourceId !== parentId,
    );

  childrenLinkedToNewAttributionIds.forEach((childId: string) =>
    removeManualAttributionFromChildIfInferable(
      manualData,
      childId,
      isAttributionBreakpoint,
    ),
  );
}

export function attributionForTemporaryDisplayPackageInfoExists(
  packageInfoToMatch: PackageInfo,
  state: State,
): boolean {
  const manualAttributions = getManualAttributions(state);
  return Object.values(manualAttributions).some((packageInfo) =>
    isEqual(packageInfo, packageInfoToMatch),
  );
}

function getAttributionDataShallowCopy(
  attributionData: AttributionData,
): AttributionData {
  return {
    attributions: { ...attributionData.attributions },
    resourcesToAttributions: { ...attributionData.resourcesToAttributions },
    attributionsToResources: { ...attributionData.attributionsToResources },
    resourcesWithAttributedChildren: {
      ...attributionData.resourcesWithAttributedChildren,
    },
  };
}

export function addPathToIndexesIfMissingInResourcesWithAttributedChildren(
  childrenWithAttributions: ResourcesWithAttributedChildren,
  path: string,
): number {
  if (childrenWithAttributions.pathsToIndices[path] === undefined) {
    const newLength = childrenWithAttributions.paths.push(path);
    childrenWithAttributions.pathsToIndices[path] = newLength - 1;
  }

  return childrenWithAttributions.pathsToIndices[path];
}
