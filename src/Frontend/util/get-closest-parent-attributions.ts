// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ResourcesToAttributions } from '../../shared/shared-types';
import { getParentsUpToNextAttributionBreakpoint } from '../state/helpers/get-parents';

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
