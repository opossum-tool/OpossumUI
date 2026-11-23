// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type {
  SavedAttributionQuickfilter,
  SavedResourceQuickfilter,
} from '../../../shared/shared-types';
import { setUserSetting } from '../actions/user-settings-actions/user-settings-actions';
import { setVariable } from '../actions/variables-actions/variables-actions';
import { createAppStore } from '../configure-store';
import {
  EXTERNAL_ATTRIBUTION_FILTERS,
  initialAttributionFilters,
  initialResourceTreeFilters,
  MANUAL_ATTRIBUTION_FILTERS_AUDIT,
  RESOURCE_TREE_FILTERS,
} from '../variables/use-filters';

const QUICKFILTER: SavedAttributionQuickfilter = {
  id: 'signal-quickfilter',
  name: 'First party',
  scope: 'signal',
  filters: { filters: ['firstParty'], search: '', valueFilters: {} },
};

const LICENSE_OPTION = { id: 'MIT', label: 'MIT' };

// License-only quickfilter saved on the signals panel; it is offered on the
// resource tree as a converted resource quickfilter.
const SIGNAL_LICENSE_QUICKFILTER: SavedAttributionQuickfilter = {
  id: 'signal-license-quickfilter',
  name: 'MIT licenses',
  scope: 'signal',
  filters: {
    filters: [],
    search: '',
    valueFilters: { license: [LICENSE_OPTION] },
  },
};

// License-only quickfilter saved on the resource panel; it is offered on the
// attribution panels as a converted attribution quickfilter.
const RESOURCE_LICENSE_QUICKFILTER: SavedResourceQuickfilter = {
  id: 'resource-license-quickfilter',
  name: 'MIT licenses',
  scope: 'resource',
  filters: {
    onlyUnreviewedFiles: false,
    onlyWithAiDeferredAttributions: false,
    selectedLicenses: [LICENSE_OPTION],
  },
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

  it('deselects a license-only signal quickfilter applied on the resources panel when its license is removed', () => {
    const store = createAppStore();
    store.dispatch(
      setUserSetting({ savedQuickfilters: [SIGNAL_LICENSE_QUICKFILTER] }),
    );
    store.dispatch(
      setVariable(RESOURCE_TREE_FILTERS, {
        ...initialResourceTreeFilters,
        selectedLicenses: [LICENSE_OPTION],
        activeQuickfilterIds: [SIGNAL_LICENSE_QUICKFILTER.id],
      }),
    );
    expect(readActiveIds(store, RESOURCE_TREE_FILTERS)).toEqual([
      SIGNAL_LICENSE_QUICKFILTER.id,
    ]);

    store.dispatch(
      setVariable(RESOURCE_TREE_FILTERS, {
        ...initialResourceTreeFilters,
        activeQuickfilterIds: [SIGNAL_LICENSE_QUICKFILTER.id],
      }),
    );

    expect(readActiveIds(store, RESOURCE_TREE_FILTERS)).toBeUndefined();
  });

  it('deselects a license-only resource quickfilter applied on the signals panel when its license is removed', () => {
    const store = createAppStore();
    store.dispatch(
      setUserSetting({ savedQuickfilters: [RESOURCE_LICENSE_QUICKFILTER] }),
    );
    store.dispatch(
      setVariable(EXTERNAL_ATTRIBUTION_FILTERS, {
        ...initialAttributionFilters,
        valueFilters: { license: [LICENSE_OPTION] },
        activeQuickfilterIds: [RESOURCE_LICENSE_QUICKFILTER.id],
      }),
    );
    expect(readActiveIds(store, EXTERNAL_ATTRIBUTION_FILTERS)).toEqual([
      RESOURCE_LICENSE_QUICKFILTER.id,
    ]);

    store.dispatch(
      setVariable(EXTERNAL_ATTRIBUTION_FILTERS, {
        ...initialAttributionFilters,
        activeQuickfilterIds: [RESOURCE_LICENSE_QUICKFILTER.id],
      }),
    );

    expect(readActiveIds(store, EXTERNAL_ATTRIBUTION_FILTERS)).toBeUndefined();
  });
});
