// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { configureStore, type Middleware } from '@reduxjs/toolkit';

import {
  isAttributionQuickfilter,
  isResourceQuickfilter,
  type UserSettings,
} from '../../shared/shared-types';
import type { State } from '../types/types';
import { isProductionBuild } from '../util/environment';
import { ACTION_SET_USER_SETTING } from './actions/user-settings-actions/types';
import { SET_VARIABLE } from './actions/variables-actions/types';
import { setVariable } from './actions/variables-actions/variables-actions';
import { reducer } from './reducer';
import type { AppThunkAction } from './types';
import {
  toAttributionQuickfilterModel,
  toResourceQuickfilterModel,
} from './variables/quickfilter-sharing';
import {
  type AttributionFilters,
  EXTERNAL_ATTRIBUTION_FILTERS,
  MANUAL_ATTRIBUTION_FILTERS_AUDIT,
  MANUAL_ATTRIBUTION_FILTERS_REPORT,
  RESOURCE_TREE_FILTERS,
  type ResourceTreeFilters,
} from './variables/use-filters';
import { areQuickfilterConditionsMet } from './variables/use-quickfilters';
import { areResourceQuickfilterConditionsMet } from './variables/use-resource-quickfilters';

const FILTER_VARIABLES_WITH_QUICKFILTERS = new Set<string>([
  EXTERNAL_ATTRIBUTION_FILTERS,
  MANUAL_ATTRIBUTION_FILTERS_AUDIT,
  MANUAL_ATTRIBUTION_FILTERS_REPORT,
  RESOURCE_TREE_FILTERS,
]);

/**
 * Quickfilters stay selected only while the current filters still contain
 * everything they contributed. Edits that remove or change one of a
 * quickfilter's conditions deselect it; filters added on top keep it active.
 * Deleting a saved quickfilter deselects it on every panel, since it can no
 * longer be checked against anywhere.
 */
const pruneDeselectedQuickfilters: Middleware<unknown, State> =
  (store) => (next) => (action) => {
    const variableAction = action as {
      type?: string;
      name?: string;
      value?: unknown;
      payload?: Partial<UserSettings>;
    };
    if (variableAction.type === ACTION_SET_USER_SETTING) {
      const incomingQuickfilters = variableAction.payload?.savedQuickfilters;
      if (incomingQuickfilters) {
        // Deletions are detected by diffing against the current settings:
        // other updates (rename, reorder, settings loaded) keep all ids.
        const removedIds = store
          .getState()
          .userSettingsState.savedQuickfilters.filter(
            ({ id }) =>
              !incomingQuickfilters.some(
                ({ id: incomingId }) => incomingId === id,
              ),
          )
          .map(({ id }) => id);
        const result = next(action);
        for (const name of FILTER_VARIABLES_WITH_QUICKFILTERS) {
          const filters = store.getState().variablesState[name] as
            (AttributionFilters & ResourceTreeFilters) | undefined;
          const activeIds = filters?.activeQuickfilterIds;
          if (!activeIds?.length) {
            continue;
          }
          const keptIds = activeIds.filter((id) => !removedIds.includes(id));
          if (keptIds.length !== activeIds.length) {
            store.dispatch(
              setVariable(name, {
                ...filters,
                activeQuickfilterIds: keptIds.length ? keptIds : undefined,
              }) as unknown as Parameters<typeof store.dispatch>[0],
            );
          }
        }
        return result;
      }
    }
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
          // variables. A quickfilter applied on another panel was converted
          // to that panel's filter shape, so the deselection check has to
          // apply the same conversion before comparing conditions.
          if (variableAction.name === RESOURCE_TREE_FILTERS) {
            const resourceModel = isResourceQuickfilter(quickfilter)
              ? quickfilter
              : isAttributionQuickfilter(quickfilter)
                ? toResourceQuickfilterModel(quickfilter)
                : null;
            return resourceModel
              ? areResourceQuickfilterConditionsMet(filters, resourceModel)
              : true;
          }
          const attributionModel = isAttributionQuickfilter(quickfilter)
            ? quickfilter
            : isResourceQuickfilter(quickfilter)
              ? toAttributionQuickfilterModel(
                  quickfilter,
                  variableAction.name === EXTERNAL_ATTRIBUTION_FILTERS
                    ? 'signal'
                    : 'attribution',
                )
              : null;
          return attributionModel
            ? areQuickfilterConditionsMet(filters, attributionModel)
            : true;
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
