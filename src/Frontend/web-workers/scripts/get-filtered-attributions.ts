// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fromPairs, pickBy } from 'lodash';

import { Attributions, PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { PanelAttributionData } from '../../util/get-contained-packages';

export const filters = Object.values(text.attributionFilters);
export type Filter = (typeof filters)[number];
export const qaFilters = ['Currently Preferred'] satisfies Array<Filter>;
export type FilterCounts = Record<Filter, number>;

export const LOW_CONFIDENCE_THRESHOLD = 60;

export const FILTER_FUNCTIONS: Record<
  Filter,
  (packageInfo: PackageInfo, attributions: Attributions) => boolean
> = {
  'Currently Preferred': (packageInfo) => !!packageInfo.preferred,
  'Excluded from Notice': (packageInfo) => !!packageInfo.excludeFromNotice,
  'First Party': (packageInfo) => !!packageInfo.firstParty,
  'Low Confidence': (packageInfo) =>
    packageInfo.attributionConfidence !== undefined &&
    packageInfo.attributionConfidence <= LOW_CONFIDENCE_THRESHOLD,
  'Modified Previously Preferred': (packageInfo, attributions) =>
    !!packageInfo.originIds?.length &&
    !packageInfo.wasPreferred &&
    !!Object.values(attributions).find(
      ({ originIds, wasPreferred }) =>
        wasPreferred &&
        originIds?.some((id) => packageInfo.originIds?.includes(id)),
    ),
  'Needs Follow-Up': (packageInfo) => !!packageInfo.followUp,
  'Needs Review by QA': (packageInfo) => !!packageInfo.needsReview,
  'Pre-selected': (packageInfo) => !!packageInfo.preSelected,
  'Previously Preferred': (packageInfo) => !!packageInfo.wasPreferred,
  'Third Party': (packageInfo) => !packageInfo.firstParty,
};

export function getFilteredAttributionCounts({
  externalData,
  manualData,
}: {
  externalData: PanelAttributionData;
  manualData: PanelAttributionData;
}): FilterCounts {
  return fromPairs(
    filters.map((filter) => [
      filter,
      Object.values(manualData.attributions).filter((attribution) =>
        FILTER_FUNCTIONS[filter](attribution, externalData.attributions),
      ).length,
    ]),
  ) as FilterCounts;
}

export function getFilteredAttributions({
  selectedFilters,
  externalData,
  manualData,
}: {
  selectedFilters: Array<Filter>;
  externalData: PanelAttributionData;
  manualData: PanelAttributionData;
}): Attributions {
  return selectedFilters.length
    ? pickBy(manualData.attributions, (attribution) =>
        selectedFilters.every((filter) =>
          FILTER_FUNCTIONS[filter](attribution, externalData.attributions),
        ),
      )
    : manualData.attributions;
}
