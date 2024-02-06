// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ReactElement } from 'react';

import { PackageInfo } from '../../../shared/shared-types';
import { HighlightingColor } from '../../enums/enums';
import { ListCardConfig } from '../../types/types';
import { isPackageInfoIncomplete } from '../../util/is-important-attribution-information-missing';
import {
  ExcludeFromNoticeIcon,
  FirstPartyIcon,
  FollowUpIcon,
  LocateSignalsIconWithTooltip,
  NeedsReviewIcon,
  PreferredIcon,
  PreSelectedIcon,
  WasPreferredIcon,
} from '../Icons/Icons';

export function getRightIcons(
  cardConfig: ListCardConfig,
  openResourcesIcon?: JSX.Element,
): Array<ReactElement> {
  const rightIcons: Array<JSX.Element> = [];

  if (openResourcesIcon) {
    rightIcons.push(openResourcesIcon);
  }

  if (cardConfig.needsReview) {
    rightIcons.push(<NeedsReviewIcon key={'needs-review-icon'} />);
  }
  if (cardConfig.followUp) {
    rightIcons.push(<FollowUpIcon key={'follow-up-icon'} />);
  }
  if (cardConfig.firstParty) {
    rightIcons.push(<FirstPartyIcon key={'first-party-icon'} />);
  }
  if (cardConfig.excludeFromNotice) {
    rightIcons.push(<ExcludeFromNoticeIcon key={'exclude-icon'} />);
  }
  if (cardConfig.isPreSelected) {
    rightIcons.push(<PreSelectedIcon key={'pre-selected-icon'} />);
  }
  if (cardConfig.isPreferred) {
    rightIcons.push(<PreferredIcon key={'preferred-icon'} />);
  } else if (cardConfig.wasPreferred) {
    rightIcons.push(<WasPreferredIcon key={'was-preferred-icon'} />);
  }
  if (cardConfig.isLocated) {
    rightIcons.push(<LocateSignalsIconWithTooltip key={'is-located-icon'} />);
  }

  return rightIcons;
}

export function getPackageCardHighlighting(
  packageInfo: PackageInfo,
): HighlightingColor | undefined {
  if (packageInfo.excludeFromNotice || packageInfo.firstParty) {
    return undefined;
  }
  if (packageInfo.packageName === undefined) {
    return HighlightingColor.DarkOrange;
  }
  return isPackageInfoIncomplete(packageInfo)
    ? HighlightingColor.LightOrange
    : undefined;
}
