// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { remove } from 'lodash';
import isEqual from 'lodash/isEqual';
import { v4 as uuid4 } from 'uuid';

import { getModifiedPreferredState } from '../../../shared/get-modified-preferred-state';
import {
  AttributionData,
  AttributionsToResources,
  PackageInfo,
  ResourcesWithAttributedChildren,
} from '../../../shared/shared-types';
import { isIdOfResourceWithChildren } from '../../util/can-resource-have-children';
import { getClosestParentWithAttributions } from '../../util/get-closest-parent-attributions';
import { getStrippedPackageInfo } from '../../util/get-stripped-package-info';
import {
  removeFromArrayCloneAndDeleteKeyFromObjectIfEmpty,
  removeFromSetCloneAndDeleteKeyFromObjectIfEmpty,
  replaceInArray,
} from '../../util/lodash-extension-utils';
import { getParents } from './get-parents';

export type CalculatePreferredOverOriginIds = (
  pathToResource: string,
  newManualAttributionToResources: AttributionsToResources,
) => Array<string>;

export function createManualAttribution(
  manualData: AttributionData,
  selectedResourceId: string,
  packageInfo: PackageInfo,
  calculatePreferredOverOriginIds: CalculatePreferredOverOriginIds,
  externalData: AttributionData,
): { newManualData: AttributionData; newAttributionId: string } {
  const newAttributionId = uuid4();

  const attributionIdsOfSelectedResource: Array<string> = manualData
    .resourcesToAttributions[selectedResourceId]
    ? [...manualData.resourcesToAttributions[selectedResourceId]]
    : [];
  attributionIdsOfSelectedResource.push(newAttributionId);

  const modifiedPreferredState = getModifiedPreferredState({
    attribution: packageInfo,
    externalAttributionsList: Object.values(externalData.attributions),
  });
  if (modifiedPreferredState) {
    packageInfo.modifiedPreferred = modifiedPreferredState.modifiedPreferred;
    packageInfo.wasPreferred = modifiedPreferredState.wasPreferred;
  }

  const newManualData: AttributionData = {
    attributions: {
      ...manualData.attributions,
      [newAttributionId]: {
        ...getStrippedPackageInfo(packageInfo),
        id: newAttributionId,
      },
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
      paths: [...manualData.resourcesWithAttributedChildren.paths],
      pathsToIndices: {
        ...manualData.resourcesWithAttributedChildren.pathsToIndices,
      },
      attributedChildren: {
        ...manualData.resourcesWithAttributedChildren.attributedChildren,
      },
    },
  };

  _addParentsToResourcesWithAttributedChildrenNoMutation(
    selectedResourceId,
    newManualData.resourcesWithAttributedChildren,
  );

  recalculatePreferencesOfParents(
    selectedResourceId,
    newManualData,
    calculatePreferredOverOriginIds,
  );

  return { newManualData, newAttributionId };
}

export function updateManualAttribution(
  attributionIdToUpdate: string,
  manualData: AttributionData,
  packageInfo: PackageInfo,
  externalData: AttributionData,
): AttributionData {
  const modifiedPreferredState = getModifiedPreferredState({
    attribution: packageInfo,
    externalAttributionsList: Object.values(externalData.attributions),
  });
  if (modifiedPreferredState) {
    packageInfo.modifiedPreferred = modifiedPreferredState.modifiedPreferred;
    packageInfo.wasPreferred = modifiedPreferredState.wasPreferred;
  }

  return {
    ...manualData,
    attributions: {
      ...manualData.attributions,
      [attributionIdToUpdate]: {
        ...getStrippedPackageInfo(packageInfo),
        id: attributionIdToUpdate,
      },
    },
  };
}

export function deleteManualAttribution(
  manualData: AttributionData,
  attributionId: string,
  attributionBreakpoints: Set<string>,
  resolvedExternalAttributions: Set<string>,
  calculatePreferredOverOriginIds: CalculatePreferredOverOriginIds,
): AttributionData {
  const newManualData = getAttributionDataShallowCopy(manualData);

  const resourceIds = manualData.attributionsToResources[attributionId] || [];
  delete newManualData.attributions[attributionId];
  delete newManualData.attributionsToResources[attributionId];

  resourceIds.forEach((resourceId) => {
    if (newManualData.resourcesToAttributions[resourceId].length > 1) {
      newManualData.resourcesToAttributions[resourceId] = [
        ...newManualData.resourcesToAttributions[resourceId],
      ];
      remove(
        newManualData.resourcesToAttributions[resourceId],
        (id) => id === attributionId,
      );
    } else {
      delete newManualData.resourcesToAttributions[resourceId];
      newManualData.resourcesWithAttributedChildren =
        computeChildrenWithAttributions(
          newManualData.attributionsToResources,
          resolvedExternalAttributions,
        );
    }
  });

  _removeAttributionsFromChildrenAndParents(
    newManualData,
    resourceIds,
    attributionBreakpoints,
  );

  resourceIds.forEach((resourceId) => {
    recalculatePreferencesOfParents(
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
  attributionBreakpoints: Set<string>,
): void {
  for (const resourceId of resourceIds) {
    removeManualAttributionFromChildrenOfParentsIfInferable(
      newManualData,
      resourceId,
      attributionBreakpoints,
    );

    removeManualAttributionFromChildIfInferable(
      newManualData,
      resourceId,
      attributionBreakpoints,
    );
  }
}

export function unlinkResourceFromAttributionId(
  manualData: AttributionData,
  resourceId: string,
  attributionId: string,
  resolvedExternalAttributions: Set<string>,
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
      computeChildrenWithAttributions(
        newManualData.attributionsToResources,
        resolvedExternalAttributions,
      );
  }

  recalculatePreferencesOfParents(
    resourceId,
    newManualData,
    calculatePreferredOverOriginIds,
  );

  return newManualData;
}

export function replaceAttributionWithMatchingAttributionId(
  manualData: AttributionData,
  attributionIdToReplaceWith: string,
  attributionIdToReplace: string,
  attributionBreakpoints: Set<string>,
): AttributionData {
  const newManualData = getAttributionDataShallowCopy(manualData);

  replaceAndDeleteAttribution(
    newManualData,
    attributionIdToReplace,
    attributionIdToReplaceWith,
  );

  _removeManualAttributionFromChildrenIfAllAreIdentical(
    newManualData,
    newManualData.attributionsToResources[attributionIdToReplaceWith],
    attributionBreakpoints,
  );

  return newManualData;
}

function replaceAndDeleteAttribution(
  manualData: AttributionData,
  attributionIdToReplace: string,
  attributionIdToReplaceWith: string,
): void {
  const resourcesToRelink =
    manualData.attributionsToResources[attributionIdToReplace];

  resourcesToRelink?.forEach((resourceId: string) => {
    manualData.resourcesToAttributions[resourceId] = [
      ...(manualData.resourcesToAttributions[resourceId] ?? []),
    ];

    if (
      manualData.resourcesToAttributions[resourceId]?.includes(
        attributionIdToReplaceWith,
      )
    ) {
      remove(
        manualData.resourcesToAttributions[resourceId],
        (attributionId) => attributionId === attributionIdToReplace,
      );
    } else {
      replaceInArray(
        manualData.resourcesToAttributions[resourceId],
        attributionIdToReplace,
        attributionIdToReplaceWith,
      );

      manualData.attributionsToResources[attributionIdToReplaceWith] = [
        ...(manualData.attributionsToResources[attributionIdToReplaceWith] ??
          []),
      ];
      manualData.attributionsToResources[attributionIdToReplaceWith]?.push(
        resourceId,
      );
    }
  });

  delete manualData.attributionsToResources[attributionIdToReplace];
  delete manualData.attributions[attributionIdToReplace];
}

export function linkToAttributionManualData(
  manualData: AttributionData,
  selectedResourceId: string,
  matchingAttributionId: string,
  attributionBreakpoints: Set<string>,
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
    attributionBreakpoints,
  );

  recalculatePreferencesOfParents(
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

export function recalculatePreferencesOfParents(
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
  idsOfChildrenWithPossiblyTheSameAttributions: Array<string> | undefined,
  attributionBreakpoints: Set<string>,
): void {
  idsOfChildrenWithPossiblyTheSameAttributions?.forEach((childId) => {
    removeManualAttributionFromChildIfInferable(
      manualData,
      childId,
      attributionBreakpoints,
    );
  });
}

function removeManualAttributionFromChildIfInferable(
  manualData: AttributionData,
  childId: string,
  attributionBreakpoints: Set<string>,
): void {
  const closestParentWithAttribution = getClosestParentWithAttributions(
    childId,
    manualData.resourcesToAttributions,
    attributionBreakpoints,
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
  attributionBreakpoints: Set<string>,
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
      attributionBreakpoints,
    ),
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
      paths: [...attributionData.resourcesWithAttributedChildren.paths],
      pathsToIndices: {
        ...attributionData.resourcesWithAttributedChildren.pathsToIndices,
      },
      attributedChildren: {
        ...attributionData.resourcesWithAttributedChildren.attributedChildren,
      },
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

export function computeChildrenWithAttributions(
  attributionsToResources: AttributionsToResources,
  resolvedAttributions?: Set<string>,
): ResourcesWithAttributedChildren {
  const childrenWithAttributions: ResourcesWithAttributedChildren = {
    paths: [],
    pathsToIndices: {},
    attributedChildren: {},
  };
  const paths = Object.entries(attributionsToResources)
    .filter(([attributionId]) => !resolvedAttributions?.has(attributionId))
    .flatMap(([, resources]) => resources);
  for (const path of paths) {
    _addPathAndParentsToResourcesWithAttributedChildren(
      path,
      childrenWithAttributions,
    );
  }

  return childrenWithAttributions;
}

function _addPathAndParentsToResourcesWithAttributedChildren(
  attributedPath: string,
  childrenWithAttributions: ResourcesWithAttributedChildren,
) {
  const attributedPathIndex =
    addPathToIndexesIfMissingInResourcesWithAttributedChildren(
      childrenWithAttributions,
      attributedPath,
    );

  getParents(attributedPath).forEach((parent) => {
    const parentIndex =
      addPathToIndexesIfMissingInResourcesWithAttributedChildren(
        childrenWithAttributions,
        parent,
      );

    if (
      childrenWithAttributions.attributedChildren[parentIndex] === undefined
    ) {
      childrenWithAttributions.attributedChildren[parentIndex] = new Set();
    }

    childrenWithAttributions.attributedChildren[parentIndex].add(
      attributedPathIndex,
    );
  });
}
