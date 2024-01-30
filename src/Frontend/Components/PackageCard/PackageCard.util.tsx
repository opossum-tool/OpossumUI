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

export function getKey(prefix: string, cardId: string): string {
  return `${prefix}-${cardId}`;
}

export function getRightIcons(
  cardConfig: ListCardConfig,
  cardId: string,
  openResourcesIcon?: JSX.Element,
): Array<ReactElement> {
  const rightIcons: Array<JSX.Element> = [];

  if (openResourcesIcon) {
    rightIcons.push(openResourcesIcon);
  }

  if (cardConfig.needsReview) {
    rightIcons.push(
      <NeedsReviewIcon key={getKey('needs-review-icon', cardId)} />,
    );
  }
  if (cardConfig.followUp) {
    rightIcons.push(<FollowUpIcon key={getKey('follow-up-icon', cardId)} />);
  }
  if (cardConfig.firstParty) {
    rightIcons.push(
      <FirstPartyIcon key={getKey('first-party-icon', cardId)} />,
    );
  }
  if (cardConfig.excludeFromNotice) {
    rightIcons.push(
      <ExcludeFromNoticeIcon key={getKey('exclude-icon', cardId)} />,
    );
  }
  if (cardConfig.isPreSelected) {
    rightIcons.push(
      <PreSelectedIcon key={getKey('pre-selected-icon', cardId)} />,
    );
  }
  if (cardConfig.isPreferred) {
    rightIcons.push(<PreferredIcon key={getKey('preferred-icon', cardId)} />);
  } else if (cardConfig.wasPreferred) {
    rightIcons.push(
      <WasPreferredIcon key={getKey('was-preferred-icon', cardId)} />,
    );
  }
  if (cardConfig.isLocated) {
    rightIcons.push(
      <LocateSignalsIconWithTooltip key={getKey('is-located-icon', cardId)} />,
    );
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
