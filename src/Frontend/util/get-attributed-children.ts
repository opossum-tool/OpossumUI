// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ResourcesWithAttributedChildren } from '../../shared/shared-types';

export function getAttributedChildren(
  resourcesWithAttributedChildren: ResourcesWithAttributedChildren,
  resourceId: string,
): Set<string> {
  const resourceIndex: number | undefined =
    resourcesWithAttributedChildren?.pathsToIndices[resourceId];
  if (resourceIndex === undefined) {
    return new Set();
  }

  const attributedChildrenIds = new Set<string>();
  resourcesWithAttributedChildren.attributedChildren[resourceIndex]?.forEach(
    (resourceIndex) =>
      attributedChildrenIds.add(
        resourcesWithAttributedChildren.paths[resourceIndex],
      ),
  );

  return attributedChildrenIds;
}
