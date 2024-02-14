// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionsToResources,
  ResourcesWithAttributedChildren,
} from '../../../shared/shared-types';
import { getParents } from './get-parents';
import { addPathToIndexesIfMissingInResourcesWithAttributedChildren } from './save-action-helpers';

export function computeChildrenWithAttributions(
  attributionsToResources: AttributionsToResources,
  resolvedAttributions?: Set<string>,
): ResourcesWithAttributedChildren {
  const childrenWithAttributions: ResourcesWithAttributedChildren = {
    paths: [],
    pathsToIndices: {},
    attributedChildren: {},
  };
  const paths = Object.entries(attributionsToResources)
    .filter(([attributionId]) => !resolvedAttributions?.has(attributionId))
    .flatMap(([, resources]) => resources);
  for (const path of paths) {
    _addPathAndParentsToResourcesWithAttributedChildren(
      path,
      childrenWithAttributions,
    );
  }

  return childrenWithAttributions;
}

function _addPathAndParentsToResourcesWithAttributedChildren(
  attributedPath: string,
  childrenWithAttributions: ResourcesWithAttributedChildren,
) {
  const attributedPathIndex =
    addPathToIndexesIfMissingInResourcesWithAttributedChildren(
      childrenWithAttributions,
      attributedPath,
    );

  getParents(attributedPath).forEach((parent) => {
    const parentIndex =
      addPathToIndexesIfMissingInResourcesWithAttributedChildren(
        childrenWithAttributions,
        parent,
      );

    if (
      childrenWithAttributions.attributedChildren[parentIndex] === undefined
    ) {
      childrenWithAttributions.attributedChildren[parentIndex] = new Set();
    }

    childrenWithAttributions.attributedChildren[parentIndex].add(
      attributedPathIndex,
    );
  });
}
