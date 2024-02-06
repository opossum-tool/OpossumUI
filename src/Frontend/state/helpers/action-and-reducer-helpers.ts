// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { pick } from 'lodash';

import {
  Attributions,
  AttributionsToResources,
  FrequentLicenseName,
  PackageInfo,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
  SelectedCriticality,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { LocatePopupFilters } from '../../types/types';
import { getClosestParentAttributionIds } from '../../util/get-closest-parent-attributions';
import { getAttributionBreakpointCheckForResourceState } from '../../util/is-attribution-breakpoint';
import {
  licenseNameContainsSearchTerm,
  packageInfoContainsSearchTerm,
} from '../../util/search-package-info';
import { sortAttributions } from '../../util/sort-attributions';
import { ResourceState } from '../reducers/resource-reducer';
import { getParents } from './get-parents';
import {
  _addParentsToResourcesWithAttributedChildrenNoMutation,
  addPathToIndexesIfMissingInResourcesWithAttributedChildren,
  deleteChildrenFromAttributedResources,
} from './save-action-helpers';

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

function _addPathAndParentsToResourcesWithAttributedChildren(
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

export function getAttributionIdOfFirstPackageCardInManualPackagePanel(
  attributionIds: Array<string> | undefined,
  resourceId: string,
  state: ResourceState,
): string {
  let displayedAttributionId = '';
  if (attributionIds && attributionIds.length > 0) {
    displayedAttributionId = Object.keys(
      sortAttributions({
        attributions: pick(
          state.allViews.manualData.attributions,
          attributionIds,
        ),
        sorting: text.sortings.name,
      }),
    )[0];
  } else {
    const closestParentAttributionIds: Array<string> =
      getClosestParentAttributionIds(
        resourceId,
        state.allViews.manualData.resourcesToAttributions,
        getAttributionBreakpointCheckForResourceState(state),
      );
    if (closestParentAttributionIds.length > 0) {
      displayedAttributionId = Object.keys(
        sortAttributions({
          attributions: pick(
            state.allViews.manualData.attributions,
            closestParentAttributionIds,
          ),
          sorting: text.sortings.name,
        }),
      )[0];
    }
  }
  return displayedAttributionId;
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
  attribution: PackageInfo,
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
