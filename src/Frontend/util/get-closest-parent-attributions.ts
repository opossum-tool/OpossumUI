// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { pick } from 'lodash';
import {
  Attributions,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import { getParentsUpToNextAttributionBreakpoint } from '../state/helpers/get-parents';
import { PathPredicate } from '../types/types';

export function getClosestParentAttributions(
  path: string,
  manualAttributions: Attributions,
  resourcesToManualAttributions: ResourcesToAttributions,
  isAttributionBreakpoint: PathPredicate,
): Attributions | null {
  const closestParentAttributionIds: Array<string> =
    getClosestParentAttributionIds(
      path,
      resourcesToManualAttributions,
      isAttributionBreakpoint,
    );
  if (closestParentAttributionIds.length > 0) {
    return pick(manualAttributions, closestParentAttributionIds);
  }

  return null;
}

export function getClosestParentAttributionIds(
  path: string,
  resourcesToManualAttributions: ResourcesToAttributions,
  isAttributionBreakpoint: PathPredicate,
): Array<string> {
  const parentId: string | null = getClosestParentWithAttributions(
    path,
    resourcesToManualAttributions,
    isAttributionBreakpoint,
  );

  if (parentId) {
    return resourcesToManualAttributions[parentId];
  }

  return [];
}

export function getClosestParentWithAttributions(
  childId: string,
  resourcesToAttributions: ResourcesToAttributions,
  isAttributionBreakpoint: PathPredicate,
): string | null {
  const parentIds: Array<string> = getParentsUpToNextAttributionBreakpoint(
    childId,
    isAttributionBreakpoint,
  );

  for (const parentId of parentIds.reverse()) {
    if (resourcesToAttributions[parentId]) {
      return parentId;
    }
  }

  return null;
}
