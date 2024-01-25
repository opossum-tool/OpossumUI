// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import isEqual from 'lodash/isEqual';
import objectHash from 'object-hash';

import {
  AttributionData,
  Attributions,
  AttributionsToHashes,
  AttributionsToResources,
  DisplayPackageInfo,
  FrequentLicenseName,
  PackageInfo,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
  SelectedCriticality,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { LocatePopupFilters } from '../../types/types';
import { getClosestParentAttributionIds } from '../../util/get-closest-parent-attributions';
import { getPackageSorter } from '../../util/get-package-sorter';
import { getAttributionBreakpointCheckForResourceState } from '../../util/is-attribution-breakpoint';
import {
  licenseNameContainsSearchTerm,
  packageInfoContainsSearchTerm,
} from '../../util/search-package-info';
import { ResourceState } from '../reducers/resource-reducer';
import { getParents } from './get-parents';
import {
  _addParentsToResourcesWithAttributedChildrenNoMutation,
  addPathToIndexesIfMissingInResourcesWithAttributedChildren,
  deleteChildrenFromAttributedResources,
} from './save-action-helpers';

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

export function getAttributionDataFromSetAttributionDataPayload(payload: {
  attributions: Attributions;
  resourcesToAttributions: ResourcesToAttributions;
}): AttributionData {
  const attributionsToResources = getAttributionsToResources(
    payload.resourcesToAttributions,
  );

  pruneAttributionsWithoutResources(
    payload.attributions,
    attributionsToResources,
  );

  return {
    attributions: payload.attributions,
    resourcesToAttributions: payload.resourcesToAttributions,
    attributionsToResources,
    resourcesWithAttributedChildren: computeChildrenWithAttributions(
      payload.resourcesToAttributions,
    ),
  };
}

export function pruneAttributionsWithoutResources(
  attributions: Attributions,
  attributionsToResources: AttributionsToResources,
): void {
  Object.keys(attributions).forEach((attributionId) => {
    if (!attributionsToResources[attributionId]) {
      delete attributions[attributionId];
    }
  });
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
      'wasPreferred',
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
          (attribution[key] === null || attribution[key] === '') &&
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
    displayedAttributionId = [...attributionIds].sort(
      getPackageSorter(
        state.allViews.manualData.attributions,
        text.sortings.name,
      ),
    )[0];
  } else {
    const closestParentAttributionIds: Array<string> =
      getClosestParentAttributionIds(
        resourceId,
        state.allViews.manualData.resourcesToAttributions,
        getAttributionBreakpointCheckForResourceState(state),
      );
    if (closestParentAttributionIds.length > 0) {
      displayedAttributionId = [...closestParentAttributionIds].sort(
        getPackageSorter(
          state.allViews.manualData.attributions,
          text.sortings.name,
        ),
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
    getPackageSorter(manualData.attributions, text.sortings.name),
  );

  const packageCardIndex = sortedAttributionIds.findIndex(
    (attributionId) => attributionId === targetAttributionId,
  );

  return packageCardIndex !== -1 ? packageCardIndex : null;
}

export function calculateResourcesWithLocatedAttributions(
  locatePopupFilters: LocatePopupFilters,
  externalAttributions: Attributions,
  externalAttributionsToResources: AttributionsToResources,
  frequentLicenseNames: Array<FrequentLicenseName>,
): Set<string> {
  const locatedResources = new Set<string>();
  if (!anyLocateFilterIsSet(locatePopupFilters)) {
    return locatedResources;
  }
  for (const attributionId in externalAttributions) {
    const attribution = externalAttributions[attributionId];
    if (
      attributionMatchesLocateFilter(
        attribution,
        locatePopupFilters,
        frequentLicenseNames,
      )
    ) {
      externalAttributionsToResources[attributionId].forEach((resource) => {
        locatedResources.add(resource);
      });
    }
  }

  return locatedResources;
}

export function anyLocateFilterIsSet(
  locatePopupFilters: LocatePopupFilters,
): boolean {
  const licenseIsSet = locatePopupFilters.selectedLicenses.size > 0;
  const criticalityIsSet =
    locatePopupFilters.selectedCriticality !== SelectedCriticality.Any;
  const searchTermIsSet: boolean = locatePopupFilters.searchTerm !== '';
  return licenseIsSet || criticalityIsSet || searchTermIsSet;
}
export function attributionMatchesLocateFilter(
  attribution: PackageInfo | DisplayPackageInfo,
  locatePopupFilter: LocatePopupFilters,
  frequentLicenseNames: Array<FrequentLicenseName>,
): boolean {
  const licenseIsSet = locatePopupFilter.selectedLicenses.size > 0;
  const criticalityIsSet =
    locatePopupFilter.selectedCriticality !== SelectedCriticality.Any;
  const augmentedLicenseNames = augmentFrequentLicenseNamesIfPresent(
    locatePopupFilter.selectedLicenses,
    frequentLicenseNames,
  );
  const licenseMatches =
    attribution.licenseName !== undefined &&
    augmentedLicenseNames.has(attribution.licenseName);
  const criticalityMatches =
    attribution.criticality === locatePopupFilter.selectedCriticality;
  const searchTermMatches =
    (locatePopupFilter.searchOnlyLicenseName &&
      licenseNameContainsSearchTerm(
        attribution,
        locatePopupFilter.searchTerm,
      )) ||
    (!locatePopupFilter.searchOnlyLicenseName &&
      packageInfoContainsSearchTerm(attribution, locatePopupFilter.searchTerm));

  return (
    (licenseMatches || !licenseIsSet) &&
    (criticalityMatches || !criticalityIsSet) &&
    searchTermMatches
  );
}
function augmentFrequentLicenseNamesIfPresent(
  licenseNames: Set<string>,
  frequentLicenseNames: Array<FrequentLicenseName>,
): Set<string> {
  // if one of the license names matches a frequent license, we want to consider the short- and the full name
  const augmentedLicenseNames = new Set([...licenseNames]);
  for (const frequentLicense of frequentLicenseNames) {
    if (licenseNames.has(frequentLicense.shortName)) {
      augmentedLicenseNames.add(frequentLicense.fullName);
    } else if (licenseNames.has(frequentLicense.fullName)) {
      augmentedLicenseNames.add(frequentLicense.shortName);
    }
  }
  return augmentedLicenseNames;
}

export function getResourcesWithLocatedChildren(
  locatedResources: Set<string>,
): Set<string> {
  const resourcesWithLocatedChildren = new Set<string>();
  for (const locatedResource of locatedResources) {
    const parents = getParents(locatedResource);
    parents.forEach((parent) => resourcesWithLocatedChildren.add(parent));
  }
  return resourcesWithLocatedChildren;
}
