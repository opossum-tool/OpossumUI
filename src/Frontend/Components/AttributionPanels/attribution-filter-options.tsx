// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import Filter3Icon from '@mui/icons-material/Filter3';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';

import type { AttributionFilterKey } from '../../../shared/attribution-filters';
import { text } from '../../../shared/text';
import { baseIcon, OpossumColors } from '../../shared-styles';
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

export interface AttributionFilterOption {
  key: AttributionFilterKey;
  label: string;
  icon: React.ReactElement<unknown>;
}

const firstParty: AttributionFilterOption = {
  key: 'firstParty',
  label: text.filters.firstParty,
  icon: <FirstPartyIcon noTooltip />,
};
const thirdParty: AttributionFilterOption = {
  key: 'thirdParty',
  label: text.filters.thirdParty,
  icon: <Filter3Icon sx={{ ...baseIcon, color: OpossumColors.darkBlue }} />,
};
const previouslyPreferred: AttributionFilterOption = {
  key: 'previouslyPreferred',
  label: text.filters.previouslyPreferred,
  icon: <WasPreferredIcon noTooltip />,
};

export const attributionFilterOptions: Array<AttributionFilterOption> = [
  firstParty,
  thirdParty,
  {
    key: 'excludedFromNotice',
    label: text.filters.excludedFromNotice,
    icon: <ExcludeFromNoticeIcon noTooltip />,
  },
  {
    key: 'lowConfidence',
    label: text.filters.lowConfidence,
    icon: <SentimentDissatisfiedIcon color={'error'} sx={baseIcon} />,
  },
  {
    key: 'needsFollowUp',
    label: text.filters.needsFollowUp,
    icon: <FollowUpIcon noTooltip />,
  },
  {
    key: 'needsReview',
    label: text.filters.needsReview,
    icon: <NeedsReviewIcon noTooltip />,
  },
  {
    key: 'preSelected',
    label: text.filters.preSelected,
    icon: <PreSelectedIcon noTooltip />,
  },
  {
    key: 'currentlyPreferred',
    label: text.filters.currentlyPreferred,
    icon: <PreferredIcon noTooltip />,
  },
  previouslyPreferred,
  {
    key: 'modifiedPreferred',
    label: text.filters.modifiedPreferred,
    icon: <ModifiedPreferredIcon noTooltip />,
  },
];

export const signalFilterOptions: Array<AttributionFilterOption> = [
  firstParty,
  thirdParty,
  {
    key: 'highConfidence',
    label: text.filters.highConfidence,
    icon: <SentimentSatisfiedIcon color={'success'} sx={baseIcon} />,
  },
  {
    key: 'notExcludedFromNotice',
    label: text.filters.notExcludedFromNotice,
    icon: <ExcludeFromNoticeIcon noTooltip />,
  },
  {
    key: 'notPreSelected',
    label: text.filters.notPreSelected,
    icon: <PreSelectedIcon noTooltip />,
  },
  previouslyPreferred,
];
