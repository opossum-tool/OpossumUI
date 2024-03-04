// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { pick } from 'lodash';

import {
  AttributionData,
  Attributions,
  PackageInfo,
  Relation,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { Filter, FilterCounts, FILTERS, Sorting } from '../../shared-constants';
import { getClosestParentAttributionIds } from '../../util/get-closest-parent-attributions';
import { getContainedAttributionCount } from '../../util/get-contained-attribution-count';
import {
  arePackageCoordinatesIncomplete,
  isLegalInformationIncomplete,
} from '../../util/is-important-attribution-information-missing';
import { packageInfoContainsSearchTerm } from '../../util/search-package-info';
import { sortAttributions } from '../../util/sort-attributions';

export const LOW_CONFIDENCE_THRESHOLD = 60;

const FILTER_FUNCTIONS: Record<Filter, (packageInfo: PackageInfo) => boolean> =
  {
    [text.filters.currentlyPreferred]: (packageInfo) => !!packageInfo.preferred,
    [text.filters.excludedFromNotice]: (packageInfo) =>
      !!packageInfo.excludeFromNotice,
    [text.filters.firstParty]: (packageInfo) => !!packageInfo.firstParty,
    [text.filters.highConfidence]: (packageInfo) =>
      packageInfo.attributionConfidence !== undefined &&
      packageInfo.attributionConfidence >= LOW_CONFIDENCE_THRESHOLD,
    [text.filters.incompleteCoordinates]: (packageInfo) =>
      arePackageCoordinatesIncomplete(packageInfo),
    [text.filters.incompleteLegal]: (packageInfo) =>
      isLegalInformationIncomplete(packageInfo),
    [text.filters.lowConfidence]: (packageInfo) =>
      packageInfo.attributionConfidence !== undefined &&
      packageInfo.attributionConfidence < LOW_CONFIDENCE_THRESHOLD,
    [text.filters.modifiedPreviouslyPreferred]: (packageInfo) =>
      !!packageInfo.modifiedPreferred,
    [text.filters.needsFollowUp]: (packageInfo) => !!packageInfo.followUp,
    [text.filters.needsReview]: (packageInfo) => !!packageInfo.needsReview,
    [text.filters.notExcludedFromNotice]: (packageInfo) =>
      !packageInfo.excludeFromNotice,
    [text.filters.preSelected]: (packageInfo) => !!packageInfo.preSelected,
    [text.filters.notPreSelected]: (packageInfo) => !packageInfo.preSelected,
    [text.filters.previouslyPreferred]: (packageInfo) =>
      !!packageInfo.wasPreferred,
    [text.filters.thirdParty]: (packageInfo) => !packageInfo.firstParty,
  };

function getVisiblePackages({
  filters,
  packages,
  resolvedExternalAttributions,
  search,
  selectedLicense,
}: {
  filters: Array<Filter>;
  packages: Array<PackageInfo>;
  resolvedExternalAttributions?: Set<string>;
  search: string;
  selectedLicense: string;
}) {
  return packages.filter(
    (attribution) =>
      !resolvedExternalAttributions?.has(attribution.id) &&
      packageInfoContainsSearchTerm(attribution, search) &&
      filters.every((filter) => FILTER_FUNCTIONS[filter](attribution)) &&
      (selectedLicense
        ? attribution.licenseName?.trim() === selectedLicense
        : true),
  );
}

export function getFilteredAttributionCounts({
  data,
  filters,
  includeGlobal,
  resolvedExternalAttributions,
  resourceId,
  search,
  selectedLicense,
}: {
  data: AttributionData;
  filters: Array<Filter>;
  includeGlobal?: boolean;
  resolvedExternalAttributions?: Set<string>;
  resourceId: string;
  search: string;
  selectedLicense: string;
}): FilterCounts {
  const attributionCount = getContainedAttributionCount({
    resourceId,
    resourcesToAttributions: data.resourcesToAttributions,
    resourcesWithAttributedChildren: data.resourcesWithAttributedChildren,
  });
  const attributions = includeGlobal
    ? data.attributions
    : pick(data.attributions, [
        ...(data.resourcesToAttributions[resourceId] ?? []),
        ...Object.keys(attributionCount),
      ]);

  const visiblePackages = getVisiblePackages({
    packages: Object.values(attributions),
    filters,
    search,
    selectedLicense,
    resolvedExternalAttributions,
  });
  return FILTERS.reduce<FilterCounts>((acc, filter) => {
    return {
      ...acc,
      [filter]: visiblePackages.filter((attribution) =>
        FILTER_FUNCTIONS[filter](attribution),
      ).length,
    };
  }, {});
}

export function getFilteredAttributions({
  attributionBreakpoints,
  data,
  filters,
  includeGlobal,
  resolvedExternalAttributions,
  resourceId,
  search,
  selectedLicense,
  sorting,
}: {
  data: AttributionData;
  filters: Array<Filter>;
  resolvedExternalAttributions?: Set<string>;
  resourceId: string;
  search: string;
  selectedLicense: string;
  sorting: Sorting;
} & (
  | {
      includeGlobal: true;
      attributionBreakpoints: Set<string>;
    }
  | {
      includeGlobal?: never;
      attributionBreakpoints?: never;
    }
)): Attributions {
  function filterAttributions({
    relation,
    attributionCount,
  }: {
    relation: Relation;
    attributionCount: Record<string, number | undefined>;
  }) {
    return getVisiblePackages({
      packages: Object.values(
        pick(data.attributions, Object.keys(attributionCount)),
      ),
      filters,
      search,
      selectedLicense,
      resolvedExternalAttributions,
    }).map<PackageInfo>((attribution) => ({
      ...attribution,
      count: attributionCount[attribution.id],
      relation,
    }));
  }

  const containedAttributionCount = getContainedAttributionCount({
    resourceId,
    resourcesToAttributions: data.resourcesToAttributions,
    resourcesWithAttributedChildren: data.resourcesWithAttributedChildren,
    resolvedExternalAttributions,
  });

  const attributions: Array<PackageInfo> = [];

  attributions.push(
    ...filterAttributions({
      relation: 'resource',
      attributionCount: Object.fromEntries(
        (data.resourcesToAttributions[resourceId] ?? []).map((id) => [
          id,
          undefined,
        ]),
      ),
    }),
  );

  attributions.push(
    ...filterAttributions({
      relation: 'children',
      attributionCount: containedAttributionCount,
    }),
  );

  if (includeGlobal) {
    const resourceAttributions = data.resourcesToAttributions[resourceId] || [];
    const parentAttributions = resourceAttributions?.length
      ? []
      : getClosestParentAttributionIds(
          resourceId,
          data.resourcesToAttributions,
          attributionBreakpoints,
        );
    const resourceRelatedIds = [
      ...resourceAttributions,
      ...Object.keys(containedAttributionCount),
      ...parentAttributions,
    ];

    attributions.push(
      ...filterAttributions({
        relation: 'parents',
        attributionCount: Object.fromEntries(
          parentAttributions.map((id) => [id, undefined]),
        ),
      }),
      ...filterAttributions({
        relation: 'unrelated',
        attributionCount: Object.fromEntries(
          Object.keys(data.attributions)
            .filter((id) => !resourceRelatedIds.includes(id))
            .map((id) => [id, data.attributionsToResources[id]?.length]),
        ),
      }),
    );
  }

  return sortAttributions({
    attributions,
    sorting,
  });
}
