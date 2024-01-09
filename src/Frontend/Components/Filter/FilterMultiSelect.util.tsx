// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import Filter3Icon from '@mui/icons-material/Filter3';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import { pickBy } from 'lodash';
import { useMemo } from 'react';

import { Attributions, PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { baseIcon, OpossumColors } from '../../shared-styles';
import { useAppSelector } from '../../state/hooks';
import {
  getExternalAttributions,
  getManualAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import { useVariable } from '../../util/use-variable';
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

export const ACTIVE_FILTERS_REDUX_KEY = 'active-filters';
export const LOW_CONFIDENCE_THRESHOLD = 60;

export const filters = Object.values(text.attributionFilters);
export type Filter = (typeof filters)[number];

export const FILTER_PROPS: Record<
  Filter,
  {
    eval: (packageInfo: PackageInfo, signals: Attributions) => boolean;
    icon: React.ReactNode;
  }
> = {
  'Currently Preferred': {
    eval: (packageInfo) => !!packageInfo.preferred,
    icon: <PreferredIcon noTooltip />,
  },
  'Excluded from Notice': {
    eval: (packageInfo) => !!packageInfo.excludeFromNotice,
    icon: <ExcludeFromNoticeIcon noTooltip />,
  },
  'First Party': {
    eval: (packageInfo) => !!packageInfo.firstParty,
    icon: <FirstPartyIcon noTooltip />,
  },
  'Low Confidence': {
    eval: (packageInfo) =>
      packageInfo.attributionConfidence !== undefined &&
      packageInfo.attributionConfidence <= LOW_CONFIDENCE_THRESHOLD,
    icon: <SentimentDissatisfiedIcon color={'error'} sx={baseIcon} />,
  },
  'Modified Previously Preferred': {
    eval: (packageInfo, signals) =>
      !!packageInfo.originIds?.length &&
      !packageInfo.wasPreferred &&
      !!Object.values(signals).find(
        ({ originIds, wasPreferred }) =>
          wasPreferred &&
          originIds?.some((id) => packageInfo.originIds?.includes(id)),
      ),
    icon: <ModifiedPreferredIcon noTooltip />,
  },
  'Needs Follow-Up': {
    eval: (packageInfo) => !!packageInfo.followUp,
    icon: <FollowUpIcon noTooltip />,
  },
  'Needs Review by QA': {
    eval: (packageInfo) => !!packageInfo.needsReview,
    icon: <NeedsReviewIcon noTooltip />,
  },
  'Pre-selected': {
    eval: (packageInfo) => !!packageInfo.preSelected,
    icon: <PreSelectedIcon noTooltip />,
  },
  'Previously Preferred': {
    eval: (packageInfo) => !!packageInfo.wasPreferred,
    icon: <WasPreferredIcon noTooltip />,
  },
  'Third Party': {
    eval: (packageInfo) => !packageInfo.firstParty,
    icon: <Filter3Icon sx={{ ...baseIcon, color: OpossumColors.darkBlue }} />,
  },
};

export function useFilteredAttributions() {
  const manualAttributions = useAppSelector(getManualAttributions);
  const externalAttributions = useAppSelector(getExternalAttributions);
  const [activeFilters] = useVariable<Array<Filter>>(
    ACTIVE_FILTERS_REDUX_KEY,
    [],
  );

  return {
    activeFilters,
    attributions: useMemo(
      () =>
        activeFilters.length
          ? pickBy(manualAttributions, (attribution) =>
              activeFilters.every((filter) =>
                FILTER_PROPS[filter].eval(attribution, externalAttributions),
              ),
            )
          : manualAttributions,
      [activeFilters, externalAttributions, manualAttributions],
    ),
  };
}
