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
  IncompleteIcon,
  NeedsReviewIcon,
  PreferredIcon,
  PreSelectedIcon,
  WasPreferredIcon,
} from '../Icons/Icons';
import { PackageCardConfig } from './PackageCard';

export function getRightIcons(cardConfig: PackageCardConfig) {
  const rightIcons: Array<JSX.Element> = [];

  if (cardConfig.preferred) {
    rightIcons.push(<PreferredIcon key={'preferred-icon'} />);
  } else if (cardConfig.wasPreferred) {
    rightIcons.push(<WasPreferredIcon key={'was-preferred-icon'} />);
  }
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
  if (cardConfig.preSelected) {
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
  if (cardConfig.incomplete) {
    rightIcons.push(<IncompleteIcon key={'incomplete-icon'} />);
  }

  return rightIcons;
}
