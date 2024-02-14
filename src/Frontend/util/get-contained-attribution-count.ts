// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../shared/shared-types';

export function getContainedAttributionCount({
  resolvedExternalAttributions,
  resourceId,
  resourcesToAttributions,
  resourcesWithAttributedChildren: {
    attributedChildren,
    paths,
    pathsToIndices,
  },
}: {
  resolvedExternalAttributions?: Set<string>;
  resourceId: string;
  resourcesToAttributions: ResourcesToAttributions;
  resourcesWithAttributedChildren: ResourcesWithAttributedChildren;
}): Record<string, number> {
  const resourceIndex = pathsToIndices[resourceId] as number | undefined;
  const resourceAttributions = resourcesToAttributions[resourceId] as
    | Array<string>
    | undefined;

  const attributionCount: Record<string, number> = {};

  resourceIndex !== undefined &&
    attributedChildren[resourceIndex]?.forEach((pathIndex) => {
      const childId = paths[pathIndex] as string | undefined;
      childId &&
        resourcesToAttributions[childId]?.forEach((attributionId) => {
          if (
            !resolvedExternalAttributions?.has(attributionId) &&
            !resourceAttributions?.includes(attributionId)
          ) {
            attributionCount[attributionId] =
              (attributionCount[attributionId] || 0) + 1;
          }
        });
    });

  return attributionCount;
}
