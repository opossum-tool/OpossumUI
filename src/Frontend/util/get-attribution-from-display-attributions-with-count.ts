// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { DisplayPackageInfo } from '../../shared/shared-types';
import {
  DisplayAttributionWithCount,
  isDisplayAttributionWithCount,
} from '../types/types';

export function getAttributionFromDisplayAttributionsWithCount(
  attributionId: string,
  displayAttributionsWithCount: Array<DisplayAttributionWithCount>
): DisplayPackageInfo {
  const attributionIdOrDisplayAttributionWithCount:
    | DisplayAttributionWithCount
    | undefined = displayAttributionsWithCount.find(
    (displayAttributionWithCount) =>
      displayAttributionWithCount.attributionId === attributionId
  );

  if (
    attributionIdOrDisplayAttributionWithCount &&
    isDisplayAttributionWithCount(attributionIdOrDisplayAttributionWithCount)
  ) {
    return attributionIdOrDisplayAttributionWithCount.attribution;
  } else {
    return {
      attributionIds: [],
    };
  }
}
