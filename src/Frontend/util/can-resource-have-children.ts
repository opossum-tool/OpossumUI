// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { mapKeys } from 'lodash';

import { Resources, ResourcesToAttributions } from '../../shared/shared-types';

export function canResourceHaveChildren(
  resource: Resources | 1 | undefined,
): resource is Resources {
  return resource !== 1 && resource !== undefined;
}

export function isIdOfResourceWithChildren(resourceId: string): boolean {
  return resourceId.slice(-1) === '/';
}

export function correctFilePathsInResourcesMapping(
  resourcesToAttributions: ResourcesToAttributions,
  filesWithChildren: Set<string>,
): ResourcesToAttributions {
  // For legacy reasons, we need every resource that can have children to have a path that ends with '/' (see function above).
  // However, when we write the resourceToAttribution mapping, then resources that are files with children should not
  // have a trailing '/' in their path because that is inconsistent with the input file.
  return mapKeys(resourcesToAttributions, (_, path) => {
    if (path.endsWith('/') && filesWithChildren.has(path.slice(0, -1))) {
      return path.slice(0, -1);
    }
    return path;
  });
}
