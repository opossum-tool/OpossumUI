// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fromPairs } from 'lodash';

import {
  AttributionData,
  Attributions,
  PackageInfo,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { Filter, FilterCounts, filters, Sorting } from '../../shared-constants';
import { isPackageInfoIncomplete } from '../../util/is-important-attribution-information-missing';
import { packageInfoContainsSearchTerm } from '../../util/search-package-info';
import { sortAttributions } from '../../util/sort-attributions';

export const LOW_CONFIDENCE_THRESHOLD = 60;

export const FILTER_FUNCTIONS: Record<
  Filter,
  (packageInfo: PackageInfo) => boolean
> = {
  [text.filters.currentlyPreferred]: (packageInfo) => !!packageInfo.preferred,
  [text.filters.excludedFromNotice]: (packageInfo) =>
    !!packageInfo.excludeFromNotice,
  [text.filters.firstParty]: (packageInfo) => !!packageInfo.firstParty,
  [text.filters.incomplete]: (packageInfo) =>
    isPackageInfoIncomplete(packageInfo),
  [text.filters.lowConfidence]: (packageInfo) =>
    packageInfo.attributionConfidence !== undefined &&
    packageInfo.attributionConfidence <= LOW_CONFIDENCE_THRESHOLD,
  [text.filters.needsFollowUp]: (packageInfo) => !!packageInfo.followUp,
  [text.filters.needsReview]: (packageInfo) => !!packageInfo.needsReview,
  [text.filters.preSelected]: (packageInfo) => !!packageInfo.preSelected,
  [text.filters.previouslyPreferred]: (packageInfo) =>
    !!packageInfo.wasPreferred,
  [text.filters.thirdParty]: (packageInfo) => !packageInfo.firstParty,
};

export function getFilteredAttributionCounts({
  manualData,
}: {
  manualData: AttributionData;
}): FilterCounts {
  return fromPairs(
    filters.map((filter) => [
      filter,
      Object.values(manualData.attributions).filter((attribution) =>
        FILTER_FUNCTIONS[filter](attribution),
      ).length,
    ]),
  ) as FilterCounts;
}

export function getFilteredAttributions({
  selectedFilters,
  manualData,
  sorting,
  search,
}: {
  selectedFilters: Array<Filter>;
  manualData: AttributionData;
  sorting: Sorting;
  search: string;
}): Attributions {
  return sortAttributions({
    sorting,
    attributions: Object.values(manualData.attributions)
      .filter(
        (attribution) =>
          packageInfoContainsSearchTerm(attribution, search) &&
          selectedFilters.every((filter) =>
            FILTER_FUNCTIONS[filter](attribution),
          ),
      )
      .map<PackageInfo>((attribution) => ({
        ...attribution,
        count: manualData.attributionsToResources[attribution.id]?.length ?? 0,
      })),
  });
}
