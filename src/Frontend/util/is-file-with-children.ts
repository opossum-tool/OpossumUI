// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PathPredicate } from '../types/types';
import { ResourceState } from '../state/reducers/resource-reducer';

export function getFileWithChildrenCheckForResourceState(
  resourceState: ResourceState
): PathPredicate {
  return getFileWithChildrenCheck(resourceState.allViews.filesWithChildren);
}

export function getFileWithChildrenCheck(
  filesWithChildren: Set<string>
): PathPredicate {
  return (path: string): boolean => filesWithChildren.has(path);
}
