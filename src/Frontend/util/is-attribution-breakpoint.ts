// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ResourceState } from '../state/reducers/resource-reducer';
import { PathPredicate, State } from '../types/types';

export function getAttributionBreakpointCheckForState(
  state: State
): PathPredicate {
  return getAttributionBreakpointCheck(
    state.resourceState.allViews.attributionBreakpoints
  );
}

export function getAttributionBreakpointCheckForResourceState(
  resourceState: ResourceState
): PathPredicate {
  return getAttributionBreakpointCheck(
    resourceState.allViews.attributionBreakpoints
  );
}

export function getAttributionBreakpointCheck(
  breakpoints: Set<string>
): PathPredicate {
  return (path: string): boolean => breakpoints.has(path);
}
