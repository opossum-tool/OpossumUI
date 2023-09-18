// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionData,
  Attributions,
  AttributionsToHashes,
  AttributionsToResources,
  FrequentLicenseName,
  PackageInfo,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
  SelectedCriticality,
} from '../../../shared/shared-types';
import isEqual from 'lodash/isEqual';
import { getParents } from './get-parents';
import {
  _addParentsToResourcesWithAttributedChildrenNoMutation,
  deleteChildrenFromAttributedResources,
} from './save-action-helpers';
import objectHash from 'object-hash';
import { ResourceState } from '../reducers/resource-reducer';
import { getAlphabeticalComparer } from '../../util/get-alphabetical-comparer';
import { getClosestParentAttributionIds } from '../../util/get-closest-parent-attributions';
import { getAttributionBreakpointCheckForResourceState } from '../../util/is-attribution-breakpoint';
import { AppThunkAction, AppThunkDispatch } from '../types';
import { setResourcesWithLocatedAttributions } from '../actions/resource-actions/all-views-simple-actions';
import {
  getExternalAttributions,
  getExternalAttributionsToResources,
  getFrequentLicensesNameOrder,
} from '../selectors/all-views-resource-selectors';
import { State } from '../../types/types';

export function getMatchingAttributionId(
  packageInfoToMatch: PackageInfo,
  attributions: Attributions,
): string {
  return (
    Object.keys(attributions).find((id) =>
      isEqual(attributions[id], packageInfoToMatch),
    ) || ''
  );
}

export function computeChildrenWithAttributions(
  resourcesToAttributions: ResourcesToAttributions,
): ResourcesWithAttributedChildren {
  const childrenWithAttributions: ResourcesWithAttributedChildren = {
    paths: [],
    pathsToIndices: {},
    attributedChildren: {},
  };
  for (const path of Object.keys(resourcesToAttributions)) {
    _addPathAndParentsToResourcesWithAttributedChildren(
      path,
      childrenWithAttributions,
    );
  }

  return childrenWithAttributions;
}

export function _addPathAndParentsToResourcesWithAttributedChildren(
  attributedPath: string,
  childrenWithAttributions: ResourcesWithAttributedChildren,
): void {
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

export function getAttributionDataFromSetAttributionDataPayload(payload: {
  attributions: Attributions;
  resourcesToAttributions: ResourcesToAttributions;
}): AttributionData {
  return {
    attributions: payload.attributions,
    resourcesToAttributions: payload.resourcesToAttributions,
    attributionsToResources: getAttributionsToResources(
      payload.resourcesToAttributions,
    ),
    resourcesWithAttributedChildren: computeChildrenWithAttributions(
      payload.resourcesToAttributions,
    ),
  };
}

function getAttributionsToResources(
  resourcesToAttributions: ResourcesToAttributions,
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
  paths: Array<string>,
): ResourcesWithAttributedChildren {
  paths.forEach((path) => {
    _addParentsToResourcesWithAttributedChildrenNoMutation(
      path,
      resourcesWithAttributedChildren,
    );
  });
  return resourcesWithAttributedChildren;
}

export function removeResolvedAttributionsFromResourcesWithAttributedChildren(
  resourcesWithAttributedChildren: ResourcesWithAttributedChildren,
  resourceIds: Array<string>,
): void {
  resourceIds.forEach((resourceId) => {
    deleteChildrenFromAttributedResources(
      resourcesWithAttributedChildren,
      resourceId,
    );
  });
}

export function createExternalAttributionsToHashes(
  externalAttributions: Attributions,
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
    externalAttributions,
  )) {
    if (attribution.firstParty || attribution.packageName) {
      const attributionKeys = Object.keys(attribution) as Array<
        keyof PackageInfo
      >;
      attributionKeys.forEach(
        (key) =>
          (attribution[key] == null || attribution[key] === '') &&
          delete attribution[key],
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
            (externalAttributionsToHashes[attributionId] = hash),
        );
      }
    },
  );

  return externalAttributionsToHashes;
}

export function getAttributionIdOfFirstPackageCardInManualPackagePanel(
  attributionIds: Array<string> | undefined,
  resourceId: string,
  state: ResourceState,
): string {
  let displayedAttributionId = '';
  if (attributionIds && attributionIds.length > 0) {
    displayedAttributionId = attributionIds.sort(
      getAlphabeticalComparer(state.allViews.manualData.attributions),
    )[0];
  } else {
    const closestParentAttributionIds: Array<string> =
      getClosestParentAttributionIds(
        resourceId,
        state.allViews.manualData.resourcesToAttributions,
        getAttributionBreakpointCheckForResourceState(state),
      );
    if (closestParentAttributionIds.length > 0) {
      displayedAttributionId = closestParentAttributionIds.sort(
        getAlphabeticalComparer(state.allViews.manualData.attributions),
      )[0];
    }
  }
  return displayedAttributionId;
}

export function getIndexOfAttributionInManualPackagePanel(
  targetAttributionId: string,
  resourceId: string,
  manualData: AttributionData,
): number | null {
  const manualAttributionIdsOnResource =
    manualData.resourcesToAttributions[resourceId];

  if (!manualAttributionIdsOnResource) {
    return null;
  }

  const sortedAttributionIds = manualAttributionIdsOnResource.sort(
    getAlphabeticalComparer(manualData.attributions),
  );

  const packageCardIndex = sortedAttributionIds.findIndex(
    (attributionId) => attributionId === targetAttributionId,
  );

  return packageCardIndex !== -1 ? packageCardIndex : null;
}

export function locateResourcesByCriticalityAndLicense(
  criticality: SelectedCriticality,
  licenseNames: Set<string>,
): AppThunkAction {
  return (dispatch: AppThunkDispatch, getState: () => State): void => {
    const locatedResources = new Set<string>();
    const attributions = getExternalAttributions(getState());
    const attributionsToResources = getExternalAttributionsToResources(
      getState(),
    );
    const frequentLicensesNameOrder: Array<FrequentLicenseName> =
      getFrequentLicensesNameOrder(getState());

    // if one of the license names matches a frequent license, we want to consider the short- and the full name
    for (const frequentLicense of frequentLicensesNameOrder) {
      if (licenseNames.has(frequentLicense.shortName)) {
        licenseNames.add(frequentLicense.fullName);
      } else if (licenseNames.has(frequentLicense.fullName)) {
        licenseNames.add(frequentLicense.shortName);
      }
    }

    for (const attributionId in attributions) {
      const attribution = attributions[attributionId];
      if (
        (criticalityMatches(criticality, attribution) &&
          !licenseIsDifferent(licenseNames, attribution)) ||
        (licenseMatches(licenseNames, attribution) &&
          !criticalityIsDifferent(criticality, attribution))
      ) {
        attributionsToResources[attributionId].forEach((resource) => {
          locatedResources.add(resource);
        });
      }
    }

    const resourcesWithLocatedChildren = new Set<string>();
    for (const locatedResource of locatedResources) {
      const parents = getParents(locatedResource);
      parents.forEach((parent) => resourcesWithLocatedChildren.add(parent));
    }

    dispatch(
      setResourcesWithLocatedAttributions(
        resourcesWithLocatedChildren,
        locatedResources,
      ),
    );
  };
}

function criticalityMatches(
  criticality: SelectedCriticality,
  attribution: PackageInfo,
): boolean {
  return (
    criticality != SelectedCriticality.Any &&
    attribution.criticality == criticality
  );
}

function criticalityIsDifferent(
  criticality: SelectedCriticality,
  attribution: PackageInfo,
): boolean {
  return (
    criticality != SelectedCriticality.Any &&
    attribution.criticality !== criticality
  );
}

function licenseMatches(
  licenseNames: Set<string>,
  attribution: PackageInfo,
): boolean {
  return (
    licenseNames.size > 0 &&
    attribution.licenseName !== undefined &&
    licenseNames.has(attribution.licenseName)
  );
}

function licenseIsDifferent(
  licenseNames: Set<string>,
  attribution: PackageInfo,
): boolean {
  return (
    licenseNames.size > 0 &&
    attribution.licenseName !== undefined &&
    !licenseNames.has(attribution.licenseName)
  );
}
