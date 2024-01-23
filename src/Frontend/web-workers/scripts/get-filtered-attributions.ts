// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fromPairs, ListIterator, orderBy } from 'lodash';

import {
  AttributionData,
  DisplayPackageInfo,
  PackageInfo,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { Filter, FilterCounts, filters, Sorting } from '../../shared-constants';
import { DisplayPackageInfos } from '../../types/types';
import { convertPackageInfoToDisplayPackageInfo } from '../../util/convert-package-info';
import { getCardLabels } from '../../util/get-card-labels';
import { getNumericalCriticalityValue } from '../../util/get-package-sorter';
import { isPackageInfoIncomplete } from '../../util/is-important-attribution-information-missing';
import { packageInfoContainsSearchTerm } from '../../util/search-package-info';

export const LOW_CONFIDENCE_THRESHOLD = 60;
const LARGEST_UNICODE_CHAR = '\u10FFFF';

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
}): DisplayPackageInfos {
  // Item is alphabetical if starts with a letter. Sort empty attributions to the end of the list.
  const iteratees: Array<ListIterator<[string, DisplayPackageInfo], unknown>> =
    [
      ([, packageInfo]) => {
        const title = getCardLabels(packageInfo)[0];
        return title >= 'a' ? title : LARGEST_UNICODE_CHAR;
      },
    ];
  const orders: Array<'asc' | 'desc'> = ['asc'];

  if (sorting === text.sortings.criticality) {
    iteratees.unshift(([, { criticality }]) =>
      getNumericalCriticalityValue(criticality),
    );
    orders.unshift('desc');
  } else if (sorting === text.sortings.occurrence) {
    iteratees.unshift(([, { count }]) => count ?? 0);
    orders.unshift('desc');
  }

  return fromPairs(
    orderBy(
      Object.entries(manualData.attributions)
        .filter(
          ([attributionId, attribution]) =>
            packageInfoContainsSearchTerm(attribution, search) &&
            selectedFilters.every((filter) =>
              FILTER_FUNCTIONS[filter](manualData.attributions[attributionId]),
            ),
        )
        .map<[string, DisplayPackageInfo]>(([attributionId, attribution]) => [
          attributionId,
          convertPackageInfoToDisplayPackageInfo(
            attribution,
            [attributionId],
            manualData.attributionsToResources[attributionId]?.length ?? 0,
          ),
        ]),
      iteratees,
      orders,
    ),
  );
}
