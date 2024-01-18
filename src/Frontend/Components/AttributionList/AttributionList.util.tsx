// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import Filter3Icon from '@mui/icons-material/Filter3';
import RuleIcon from '@mui/icons-material/Rule';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import { difference, isEqual, sortBy } from 'lodash';
import { useEffect, useMemo } from 'react';

import { text } from '../../../shared/text';
import { Filter, filters, qaFilters } from '../../shared-constants';
import { baseIcon, OpossumColors } from '../../shared-styles';
import { useFilteredAttributions } from '../../state/variables/use-filtered-attributions';
import { useUserSetting } from '../../util/use-user-setting';
import {
  ExcludeFromNoticeIcon,
  FirstPartyIcon,
  FollowUpIcon,
  NeedsReviewIcon,
  PreferredIcon,
  PreSelectedIcon,
  WasPreferredIcon,
} from '../Icons/Icons';
import { SelectMenuOption } from '../SelectMenu/SelectMenu';

export const FILTER_ICONS: Record<Filter, React.ReactElement> = {
  [text.filters.currentlyPreferred]: <PreferredIcon noTooltip />,
  [text.filters.excludedFromNotice]: <ExcludeFromNoticeIcon noTooltip />,
  [text.filters.firstParty]: <FirstPartyIcon noTooltip />,
  [text.filters.incomplete]: <RuleIcon color={'info'} sx={baseIcon} />,
  [text.filters.lowConfidence]: (
    <SentimentDissatisfiedIcon color={'error'} sx={baseIcon} />
  ),
  [text.filters.needsFollowUp]: <FollowUpIcon noTooltip />,
  [text.filters.needsReview]: <NeedsReviewIcon noTooltip />,
  [text.filters.preSelected]: <PreSelectedIcon noTooltip />,
  [text.filters.previouslyPreferred]: <WasPreferredIcon noTooltip />,
  [text.filters.thirdParty]: (
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
