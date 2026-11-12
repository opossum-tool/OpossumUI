// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { configureStore, type Middleware } from '@reduxjs/toolkit';

import {
  isAttributionQuickfilter,
  isResourceQuickfilter,
} from '../../shared/shared-types';
import type { State } from '../types/types';
import { isProductionBuild } from '../util/environment';
import { SET_VARIABLE } from './actions/variables-actions/types';
import { setVariable } from './actions/variables-actions/variables-actions';
import { reducer } from './reducer';
import type { AppThunkAction } from './types';
import {
  type AttributionFilters,
  MANUAL_ATTRIBUTION_FILTERS_AUDIT,
  MANUAL_ATTRIBUTION_FILTERS_REPORT,
  RESOURCE_TREE_FILTERS,
  type ResourceTreeFilters,
} from './variables/use-filters';
import { areQuickfilterConditionsMet } from './variables/use-quickfilters';
import { areResourceQuickfilterConditionsMet } from './variables/use-resource-quickfilters';

const FILTER_VARIABLES_WITH_QUICKFILTERS = new Set<string>([
  MANUAL_ATTRIBUTION_FILTERS_AUDIT,
  MANUAL_ATTRIBUTION_FILTERS_REPORT,
  RESOURCE_TREE_FILTERS,
]);

/**
 * Quickfilters stay selected only while the current filters still contain
 * everything they contributed. Edits that remove or change one of a
 * quickfilter's conditions deselect it; filters added on top keep it active.
 */
const pruneDeselectedQuickfilters: Middleware<unknown, State> =
  (store) => (next) => (action) => {
    const variableAction = action as {
      type?: string;
      name?: string;
      value?: unknown;
    };
    if (
      variableAction.type === SET_VARIABLE &&
      variableAction.name !== undefined &&
      FILTER_VARIABLES_WITH_QUICKFILTERS.has(variableAction.name)
    ) {
      const filters = variableAction.value as AttributionFilters &
        ResourceTreeFilters;
      const activeIds = filters?.activeQuickfilterIds;
      if (activeIds?.length) {
        const { savedQuickfilters } = store.getState().userSettingsState;
        const keptIds = activeIds.filter((id) => {
          const quickfilter = savedQuickfilters.find(
            ({ id: quickfilterId }) => quickfilterId === id,
          );
          // Unresolvable ids (e.g. just saved, persistence still pending) are
          // kept; only conditions we can check may deselect a quickfilter.
          if (quickfilter === undefined) {
            return true;
          }
          // Attribution and resource quickfilters live in different filter
          // variables; a quickfilter can only be deselected by changes to
          // the variable kind it belongs to.
          if (isResourceQuickfilter(quickfilter)) {
            return variableAction.name === RESOURCE_TREE_FILTERS
              ? areResourceQuickfilterConditionsMet(filters, quickfilter)
              : true;
          }
          if (isAttributionQuickfilter(quickfilter)) {
            return variableAction.name === RESOURCE_TREE_FILTERS
              ? true
              : areQuickfilterConditionsMet(filters, quickfilter);
          }
          return true;
        });
        if (keptIds.length !== activeIds.length) {
          return next(
            setVariable(variableAction.name, {
              ...filters,
              activeQuickfilterIds: keptIds.length ? keptIds : undefined,
            }),
          );
        }
      }
    }
    return next(action);
  };

type Store = ReturnType<typeof createAppStore>;
export type Action = AppThunkAction | Parameters<Store['dispatch']>[0];

export function createAppStore() {
  return configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(pruneDeselectedQuickfilters),
    devTools: !isProductionBuild(),
  });
}
