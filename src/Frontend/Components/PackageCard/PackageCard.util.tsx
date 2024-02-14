// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import {
  CriticalityIcon,
  ExcludeFromNoticeIcon,
  FirstPartyIcon,
  FollowUpIcon,
  NeedsReviewIcon,
  PreferredIcon,
  PreSelectedIcon,
  WasPreferredIcon,
} from '../Icons/Icons';
import { ListCardConfig } from '../ListCard/ListCard';

export function getRightIcons(cardConfig: ListCardConfig) {
  const rightIcons: Array<JSX.Element> = [];

  if (cardConfig.criticality) {
    rightIcons.push(
      <CriticalityIcon
        key={'criticality-icon'}
        criticality={cardConfig.criticality}
        tooltip={
          cardConfig.criticality === Criticality.High
            ? text.auditingOptions.highCriticality
            : text.auditingOptions.mediumCriticality
        }
      />,
    );
  }
  if (cardConfig.isPreferred) {
    rightIcons.push(<PreferredIcon key={'preferred-icon'} />);
  } else if (cardConfig.wasPreferred) {
    rightIcons.push(<WasPreferredIcon key={'was-preferred-icon'} />);
  }
  if (cardConfig.isPreSelected) {
    rightIcons.push(<PreSelectedIcon key={'pre-selected-icon'} />);
  }
  if (cardConfig.excludeFromNotice) {
    rightIcons.push(<ExcludeFromNoticeIcon key={'exclude-icon'} />);
  }
  if (cardConfig.firstParty) {
    rightIcons.push(<FirstPartyIcon key={'first-party-icon'} />);
  }
  if (cardConfig.followUp) {
    rightIcons.push(<FollowUpIcon key={'follow-up-icon'} />);
  }
  if (cardConfig.needsReview) {
    rightIcons.push(<NeedsReviewIcon key={'needs-review-icon'} />);
  }

  return rightIcons;
}
