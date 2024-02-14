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

export function getClosestParentAttributions(
  path: string,
  manualAttributions: Attributions,
  resourcesToManualAttributions: ResourcesToAttributions,
  attributionBreakpoints: Set<string>,
): Attributions | null {
  const closestParentAttributionIds = getClosestParentAttributionIds(
    path,
    resourcesToManualAttributions,
    attributionBreakpoints,
  );
  if (closestParentAttributionIds.length > 0) {
    return pick(manualAttributions, closestParentAttributionIds);
  }

  return null;
}

export function getClosestParentAttributionIds(
  path: string,
  resourcesToManualAttributions: ResourcesToAttributions,
  attributionBreakpoints: Set<string>,
): Array<string> {
  const parentResourceId = getClosestParentWithAttributions(
    path,
    resourcesToManualAttributions,
    attributionBreakpoints,
  );

  if (parentResourceId) {
    return resourcesToManualAttributions[parentResourceId];
  }

  return [];
}

export function getClosestParentWithAttributions(
  childId: string,
  resourcesToAttributions: ResourcesToAttributions,
  attributionBreakpoints: Set<string>,
): string | null {
  const parentIds = getParentsUpToNextAttributionBreakpoint(
    childId,
    attributionBreakpoints,
  );

  for (const parentId of parentIds.reverse()) {
    if (resourcesToAttributions[parentId]) {
      return parentId;
    }
  }

  return null;
}
