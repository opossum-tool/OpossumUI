// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SavedAttributionQuickfilter } from '../../../shared/shared-types';
import { setUserSetting } from '../actions/user-settings-actions/user-settings-actions';
import { setVariable } from '../actions/variables-actions/variables-actions';
import { createAppStore } from '../configure-store';
import {
  EXTERNAL_ATTRIBUTION_FILTERS,
  initialAttributionFilters,
  MANUAL_ATTRIBUTION_FILTERS_AUDIT,
} from '../variables/use-filters';

const QUICKFILTER: SavedAttributionQuickfilter = {
  id: 'signal-quickfilter',
  name: 'First party',
  lastUsedAt: 1,
  scope: 'signal',
  filters: { filters: ['firstParty'], search: '', valueFilters: {} },
};

function readActiveIds(
  store: { getState(): { variablesState: Record<string, unknown> } },
  name: string,
): Array<string> | undefined {
  return (
    store.getState().variablesState[name] as
      { activeQuickfilterIds?: Array<string> } | undefined
  )?.activeQuickfilterIds;
}

describe('pruning of deselected quickfilters', () => {
  it('deselects a quickfilter on the signals panel when its conditions are removed manually', () => {
    const store = createAppStore();
    store.dispatch(setUserSetting({ savedQuickfilters: [QUICKFILTER] }));
    store.dispatch(
      setVariable(EXTERNAL_ATTRIBUTION_FILTERS, {
        ...initialAttributionFilters,
        filters: ['firstParty'],
        activeQuickfilterIds: [QUICKFILTER.id],
      }),
    );
    expect(readActiveIds(store, EXTERNAL_ATTRIBUTION_FILTERS)).toEqual([
      QUICKFILTER.id,
    ]);

    store.dispatch(
      setVariable(EXTERNAL_ATTRIBUTION_FILTERS, {
        ...initialAttributionFilters,
        activeQuickfilterIds: [QUICKFILTER.id],
      }),
    );

    expect(readActiveIds(store, EXTERNAL_ATTRIBUTION_FILTERS)).toBeUndefined();
  });

  it('deselects a quickfilter on the attributions panel when its conditions are removed manually', () => {
    const store = createAppStore();
    store.dispatch(setUserSetting({ savedQuickfilters: [QUICKFILTER] }));
    store.dispatch(
      setVariable(MANUAL_ATTRIBUTION_FILTERS_AUDIT, {
        ...initialAttributionFilters,
        filters: ['firstParty'],
        activeQuickfilterIds: [QUICKFILTER.id],
      }),
    );

    store.dispatch(
      setVariable(MANUAL_ATTRIBUTION_FILTERS_AUDIT, {
        ...initialAttributionFilters,
        activeQuickfilterIds: [QUICKFILTER.id],
      }),
    );

    expect(
      readActiveIds(store, MANUAL_ATTRIBUTION_FILTERS_AUDIT),
    ).toBeUndefined();
  });

  it('keeps a quickfilter selected while its conditions still hold', () => {
    const store = createAppStore();
    store.dispatch(setUserSetting({ savedQuickfilters: [QUICKFILTER] }));
    store.dispatch(
      setVariable(EXTERNAL_ATTRIBUTION_FILTERS, {
        ...initialAttributionFilters,
        filters: ['firstParty'],
        activeQuickfilterIds: [QUICKFILTER.id],
      }),
    );

    // Filters added on top keep the quickfilter selected.
    store.dispatch(
      setVariable(EXTERNAL_ATTRIBUTION_FILTERS, {
        ...initialAttributionFilters,
        filters: ['firstParty', 'thirdParty'],
        search: 'react',
        activeQuickfilterIds: [QUICKFILTER.id],
      }),
    );

    expect(readActiveIds(store, EXTERNAL_ATTRIBUTION_FILTERS)).toEqual([
      QUICKFILTER.id,
    ]);
  });
});
