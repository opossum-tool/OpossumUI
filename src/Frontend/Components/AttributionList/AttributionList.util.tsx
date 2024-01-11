// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import Filter3Icon from '@mui/icons-material/Filter3';
import RuleIcon from '@mui/icons-material/Rule';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import { difference, isEqual, sortBy } from 'lodash';
import { useEffect, useMemo } from 'react';

import { Attributions } from '../../../shared/shared-types';
import { baseIcon, OpossumColors } from '../../shared-styles';
import { DisplayPackageInfos } from '../../types/types';
import { convertPackageInfoToDisplayPackageInfo } from '../../util/convert-package-info';
import { getAlphabeticalComparerForAttributions } from '../../util/get-alphabetical-comparer';
import { packageInfoContainsSearchTerm } from '../../util/search-package-info';
import { useUserSetting } from '../../util/use-user-setting';
import {
  Filter,
  filters,
  qaFilters,
} from '../../web-workers/scripts/get-filtered-attributions';
import { useFilteredAttributions } from '../../web-workers/use-signals-worker';
import {
  ExcludeFromNoticeIcon,
  FirstPartyIcon,
  FollowUpIcon,
  ModifiedPreferredIcon,
  NeedsReviewIcon,
  PreferredIcon,
  PreSelectedIcon,
  WasPreferredIcon,
} from '../Icons/Icons';
import { SelectMenuOption } from '../SelectMenu/SelectMenu';

export const FILTER_ICONS: Record<Filter, React.ReactElement> = {
  'Currently Preferred': <PreferredIcon noTooltip />,
  'Excluded from Notice': <ExcludeFromNoticeIcon noTooltip />,
  'First Party': <FirstPartyIcon noTooltip />,
  Incomplete: <RuleIcon color={'info'} sx={baseIcon} />,
  'Low Confidence': <SentimentDissatisfiedIcon color={'error'} sx={baseIcon} />,
  'Modified Previously Preferred': <ModifiedPreferredIcon noTooltip />,
  'Needs Follow-Up': <FollowUpIcon noTooltip />,
  'Needs Review by QA': <NeedsReviewIcon noTooltip />,
  'Pre-selected': <PreSelectedIcon noTooltip />,
  'Previously Preferred': <WasPreferredIcon noTooltip />,
  'Third Party': (
    <Filter3Icon sx={{ ...baseIcon, color: OpossumColors.darkBlue }} />
  ),
};

export function useFilterMenuOptions() {
  const [{ selectedFilters, counts }, setFilteredAttributions] =
    useFilteredAttributions();
  const [qaMode] = useUserSetting({ defaultValue: false, key: 'qaMode' });

  useEffect(() => {
    const purged = selectedFilters.filter((filter) => counts?.[filter] !== 0);
    if (!isEqual(sortBy(purged), sortBy(selectedFilters))) {
      setFilteredAttributions((prev) => ({
        ...prev,
        selectedFilters: purged,
      }));
    }
  }, [counts, selectedFilters, setFilteredAttributions]);

  return {
    selectedFilters,
    options: useMemo<Array<SelectMenuOption>>(
      () =>
        difference(filters, qaMode ? [] : qaFilters)
          .filter((filter) => counts?.[filter] !== 0)
          .map((filter) => ({
            selected: selectedFilters.includes(filter),
            id: filter,
            label: counts ? `${filter} (${counts[filter]})` : filter,
            icon: FILTER_ICONS[filter],
            onAdd: () =>
              setFilteredAttributions((prev) => ({
                ...prev,
                selectedFilters: [...prev.selectedFilters, filter],
              })),
            onDelete: () =>
              setFilteredAttributions((prev) => ({
                ...prev,
                selectedFilters: prev.selectedFilters.filter(
                  (f) => f !== filter,
                ),
              })),
          })),
      [selectedFilters, counts, qaMode, setFilteredAttributions],
    ),
  };
}

export function getFilteredAndSortedPackageCardIdsAndDisplayPackageInfos(
  attributions: Attributions,
  search: string,
  sortByCriticality: boolean,
) {
  const sortedAttributionIds = Object.keys(attributions).sort(
    getAlphabeticalComparerForAttributions(attributions, sortByCriticality),
  );

  const filteredAndSortedIds: Array<string> = [];
  const filteredAndSortedAttributions: DisplayPackageInfos = {};

  sortedAttributionIds.forEach((attributionId) => {
    const packageInfo = convertPackageInfoToDisplayPackageInfo(
      attributions[attributionId],
      [attributionId],
    );
    if (packageInfoContainsSearchTerm(packageInfo, search)) {
      filteredAndSortedIds.push(attributionId);
      filteredAndSortedAttributions[attributionId] = packageInfo;
    }
  });
  return { filteredAndSortedIds, filteredAndSortedAttributions };
}
