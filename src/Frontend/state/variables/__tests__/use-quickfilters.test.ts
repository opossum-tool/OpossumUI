// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act } from '@testing-library/react';

import type { SavedQuickfilter } from '../../../../shared/shared-types';
import { faker } from '../../../../testing/Faker';
import { renderHook } from '../../../test-helpers/render';
import { setUserSetting } from '../../actions/user-settings-actions/user-settings-actions';
import {
  type AttributionFilters,
  initialAttributionFilters,
} from '../use-filters';
import {
  areQuickfilterConditionsMet,
  combineQuickfilters,
  isQuickfilterCompatible,
  isQuickfilterUsableInProject,
  mergeQuickfilterIntoFilters,
  useQuickfilters,
} from '../use-quickfilters';

describe('mergeQuickfilterIntoFilters', () => {
  it('unions filter keys and license conditions and appends the id', () => {
    const current: AttributionFilters = {
      ...initialAttributionFilters,
      filters: ['firstParty'],
      valueFilters: { license: [{ id: 'MIT', label: 'MIT' }] },
      activeQuickfilterIds: ['first-id'],
    };
    const quickfilter = makeQuickfilter({
      id: 'second-id',
      filters: {
        filters: ['thirdParty'],
        search: 'react',
        valueFilters: {
          license: [
            { id: 'MIT', label: 'MIT' },
            { id: 'Apache-2.0', label: 'Apache-2.0' },
          ],
          licenseSearches: ['apache'],
        },
      },
    });

    expect(mergeQuickfilterIntoFilters(current, quickfilter)).toEqual({
      ...current,
      filters: ['firstParty', 'thirdParty'],
      search: 'react',
      valueFilters: {
        license: [
          { id: 'MIT', label: 'MIT' },
          { id: 'Apache-2.0', label: 'Apache-2.0' },
        ],
        licenseSearches: ['apache'],
      },
      activeQuickfilterIds: ['first-id', 'second-id'],
    });
  });

  it('fills unset scalar fields from the quickfilter and keeps current ones', () => {
    const current: AttributionFilters = {
      ...initialAttributionFilters,
      valueFilters: { classification: 1 },
    };
    const quickfilter = makeQuickfilter({
      filters: {
        filters: [],
        search: '',
        valueFilters: { classification: 1, criticality: 2 },
      },
    });

    expect(
      mergeQuickfilterIntoFilters(current, quickfilter).valueFilters,
    ).toEqual({ classification: 1, criticality: 2 });
  });
});

describe('isQuickfilterCompatible', () => {
  it('accepts unset, equal, and union-combinable fields', () => {
    const current: AttributionFilters = {
      ...initialAttributionFilters,
      filters: ['firstParty'],
      search: 'react',
      valueFilters: { classification: 1 },
    };
    const compatible = makeQuickfilter({
      filters: {
        filters: ['thirdParty'],
        search: '',
        valueFilters: { classification: 1, criticality: 2 },
      },
    });

    expect(isQuickfilterCompatible(current, compatible)).toBe(true);
  });

  it('rejects conflicting search text and scalar value filters', () => {
    const current: AttributionFilters = {
      ...initialAttributionFilters,
      search: 'react',
      valueFilters: { classification: 1 },
    };
    const conflictingSearch = makeQuickfilter({
      filters: { filters: [], search: 'vue', valueFilters: {} },
    });
    const conflictingClassification = makeQuickfilter({
      filters: { filters: [], search: '', valueFilters: { classification: 2 } },
    });

    expect(isQuickfilterCompatible(current, conflictingSearch)).toBe(false);
    expect(isQuickfilterCompatible(current, conflictingClassification)).toBe(
      false,
    );
  });
});

describe('areQuickfilterConditionsMet', () => {
  it('holds when the filters contain everything the quickfilter contributed', () => {
    const quickfilter = makeQuickfilter({
      filters: {
        filters: ['firstParty'],
        search: 'react',
        valueFilters: {
          classification: 1,
          license: [{ id: 'MIT', label: 'MIT' }],
          licenseSearches: ['apache'],
        },
      },
    });
    const current: AttributionFilters = {
      ...initialAttributionFilters,
      filters: ['firstParty'],
      search: 'react',
      valueFilters: {
        classification: 1,
        license: [{ id: 'MIT', label: 'MIT' }],
        licenseSearches: ['apache'],
      },
      activeQuickfilterIds: [quickfilter.id],
    };

    expect(areQuickfilterConditionsMet(current, quickfilter)).toBe(true);
  });

  it('holds when further filters are added on top', () => {
    const quickfilter = makeQuickfilter({
      filters: { filters: ['firstParty'], search: '', valueFilters: {} },
    });
    const current: AttributionFilters = {
      ...initialAttributionFilters,
      filters: ['firstParty', 'thirdParty'],
      valueFilters: { criticality: 2 },
      activeQuickfilterIds: [quickfilter.id],
    };

    expect(areQuickfilterConditionsMet(current, quickfilter)).toBe(true);
  });

  it('breaks when one of the quickfilter filter keys is removed', () => {
    const quickfilter = makeQuickfilter({
      filters: { filters: ['firstParty'], search: '', valueFilters: {} },
    });
    const current: AttributionFilters = {
      ...initialAttributionFilters,
      filters: [],
      activeQuickfilterIds: [quickfilter.id],
    };

    expect(areQuickfilterConditionsMet(current, quickfilter)).toBe(false);
  });

  it('breaks when the search text is changed', () => {
    const quickfilter = makeQuickfilter({
      filters: { filters: [], search: 'react', valueFilters: {} },
    });
    const current: AttributionFilters = {
      ...initialAttributionFilters,
      search: 'vue',
      activeQuickfilterIds: [quickfilter.id],
    };

    expect(areQuickfilterConditionsMet(current, quickfilter)).toBe(false);
  });

  it('breaks when a scalar value filter is changed', () => {
    const quickfilter = makeQuickfilter({
      filters: { filters: [], search: '', valueFilters: { classification: 1 } },
    });
    const current: AttributionFilters = {
      ...initialAttributionFilters,
      valueFilters: { classification: 2 },
      activeQuickfilterIds: [quickfilter.id],
    };

    expect(areQuickfilterConditionsMet(current, quickfilter)).toBe(false);
  });

  it('breaks when a license condition is removed', () => {
    const quickfilter = makeQuickfilter({
      filters: {
        filters: [],
        search: '',
        valueFilters: { license: [{ id: 'MIT', label: 'MIT' }] },
      },
    });
    const current: AttributionFilters = {
      ...initialAttributionFilters,
      valueFilters: {},
      activeQuickfilterIds: [quickfilter.id],
    };

    expect(areQuickfilterConditionsMet(current, quickfilter)).toBe(false);
  });
});

describe('combineQuickfilters', () => {
  it('recomputes the merged filters from the given ids and keeps sorting', () => {
    const first = makeQuickfilter({
      id: 'first-id',
      filters: { filters: ['firstParty'], search: 'react', valueFilters: {} },
    });
    const second = makeQuickfilter({
      id: 'second-id',
      filters: {
        filters: [],
        search: '',
        valueFilters: { license: [{ id: 'MIT', label: 'MIT' }] },
      },
    });

    expect(
      combineQuickfilters({
        ids: ['second-id'],
        quickfilters: [first, second],
        sorting: 'criticality',
      }),
    ).toEqual({
      ...initialAttributionFilters,
      sorting: 'criticality',
      valueFilters: { license: [{ id: 'MIT', label: 'MIT' }] },
      activeQuickfilterIds: ['second-id'],
    });

    expect(
      combineQuickfilters({
        ids: [],
        quickfilters: [first],
        sorting: 'occurrence',
      }),
    ).toEqual({ ...initialAttributionFilters, sorting: 'occurrence' });
  });
});

describe('isQuickfilterUsableInProject', () => {
  const context = {
    classificationIds: new Set([1, 2]),
    showClassifications: true,
    showCriticality: true,
  };

  it('accepts quickfilters without classification or criticality filters', () => {
    const quickfilter = makeQuickfilter({
      filters: {
        filters: ['firstParty'],
        search: 'react',
        valueFilters: { license: [{ id: 'MIT', label: 'MIT' }] },
      },
    });

    expect(isQuickfilterUsableInProject(quickfilter, context)).toBe(true);
  });

  it('accepts classification and criticality filters the project can express', () => {
    const quickfilter = makeQuickfilter({
      filters: {
        filters: [],
        search: '',
        valueFilters: { classification: 1, criticality: 2 },
      },
    });

    expect(isQuickfilterUsableInProject(quickfilter, context)).toBe(true);
  });

  it('rejects classification ids the project does not define', () => {
    const quickfilter = makeQuickfilter({
      filters: {
        filters: [],
        search: '',
        valueFilters: { classification: 7 },
      },
    });

    expect(isQuickfilterUsableInProject(quickfilter, context)).toBe(false);
  });

  it('rejects classification filters when classifications are hidden', () => {
    const quickfilter = makeQuickfilter({
      filters: { filters: [], search: '', valueFilters: { classification: 1 } },
    });
    const withoutClassification = makeQuickfilter({
      filters: { filters: [], search: '', valueFilters: {} },
    });

    expect(
      isQuickfilterUsableInProject(quickfilter, {
        ...context,
        showClassifications: false,
      }),
    ).toBe(false);
    expect(
      isQuickfilterUsableInProject(withoutClassification, {
        ...context,
        showClassifications: false,
      }),
    ).toBe(true);
  });

  it('rejects criticality filters when criticality is hidden', () => {
    const quickfilter = makeQuickfilter({
      filters: { filters: [], search: '', valueFilters: { criticality: 2 } },
    });

    expect(
      isQuickfilterUsableInProject(quickfilter, {
        ...context,
        showCriticality: false,
      }),
    ).toBe(false);
  });
});

function makeQuickfilter({
  id = faker.string.uuid(),
  name = faker.string.sample(),
  scope = 'attribution',
  filters = { filters: [], search: '', valueFilters: {} },
}: {
  id?: string;
  name?: string;
  scope?: SavedQuickfilter['scope'];
  filters?: SavedQuickfilter['filters'];
} = {}): SavedQuickfilter {
  return {
    id,
    name,
    lastUsedAt: faker.number.int(),
    scope,
    filters,
  };
}

describe('useQuickfilters', () => {
  it('returns an empty list by default', async () => {
    const { result } = await renderHook(() => useQuickfilters('attribution'));

    expect(result.current.quickfilters).toEqual([]);
  });

  it('saves a quickfilter and persists it', async () => {
    const { result } = await renderHook(() => useQuickfilters('attribution'));
    const name = faker.string.sample();
    const filters: AttributionFilters = {
      ...initialAttributionFilters,
      filters: ['firstParty'],
    };

    let savedId: string | undefined;
    await act(async () => {
      savedId = result.current.saveQuickfilter(name, filters);
      await Promise.resolve();
    });

    expect(result.current.quickfilters).toHaveLength(1);
    expect(result.current.quickfilters[0]).toMatchObject({
      id: savedId,
      name,
      scope: 'attribution',
      filters: { filters: ['firstParty'], search: '', valueFilters: {} },
    });
    expect(window.electronAPI.updateUserSettings).toHaveBeenLastCalledWith({
      savedQuickfilters: [expect.objectContaining({ name })],
    });
  });

  it('shows a saved quickfilter immediately, before the persistence round-trip resolves', async () => {
    const { result } = await renderHook(() => useQuickfilters('attribution'));
    const name = faker.string.sample();
    const { promise, resolve } = Promise.withResolvers<void>();
    vi.mocked(window.electronAPI.updateUserSettings).mockReturnValueOnce(
      promise,
    );

    let savedId: string | undefined;
    act(() => {
      savedId = result.current.saveQuickfilter(name, initialAttributionFilters);
    });

    expect(result.current.quickfilters).toHaveLength(1);
    expect(result.current.quickfilters[0]).toMatchObject({
      id: savedId,
      name,
    });
    expect(window.electronAPI.updateUserSettings).toHaveBeenCalledWith({
      savedQuickfilters: [expect.objectContaining({ name })],
    });

    resolve();
    await act(async () => {
      await promise;
    });
  });

  it('hides quickfilters saved under another scope', async () => {
    const { result: attributionResult } = await renderHook(() =>
      useQuickfilters('attribution'),
    );
    const { result: signalResult } = await renderHook(() =>
      useQuickfilters('signal'),
    );

    await act(async () => {
      signalResult.current.saveQuickfilter(
        faker.string.sample(),
        initialAttributionFilters,
      );
      await Promise.resolve();
    });

    expect(signalResult.current.quickfilters).toHaveLength(1);
    expect(attributionResult.current.quickfilters).toEqual([]);
  });

  it('stores a deep copy so later filter changes do not affect the saved quickfilter', async () => {
    const { result } = await renderHook(() => useQuickfilters('attribution'));
    const filters: AttributionFilters = {
      ...initialAttributionFilters,
      filters: ['firstParty'],
      valueFilters: { classification: 1 },
    };

    await act(async () => {
      result.current.saveQuickfilter(faker.string.sample(), filters);
      await Promise.resolve();
    });

    filters.filters.push('thirdParty');
    filters.valueFilters.classification = 2;

    expect(result.current.quickfilters[0].filters).toEqual({
      filters: ['firstParty'],
      search: '',
      valueFilters: { classification: 1 },
    });
  });

  it('deletes a quickfilter', async () => {
    const { result } = await renderHook(() => useQuickfilters('attribution'));
    const name = faker.string.sample();

    await act(async () => {
      result.current.saveQuickfilter(name, initialAttributionFilters);
      await Promise.resolve();
    });
    await act(async () => {
      result.current.deleteQuickfilter(result.current.quickfilters[0].id);
      await Promise.resolve();
    });

    expect(result.current.quickfilters).toEqual([]);
  });

  it('removes a deleted quickfilter immediately, before the persistence round-trip resolves', async () => {
    const { result } = await renderHook(() => useQuickfilters('attribution'));
    const name = faker.string.sample();

    await act(async () => {
      result.current.saveQuickfilter(name, initialAttributionFilters);
      await Promise.resolve();
    });
    const { promise, resolve } = Promise.withResolvers<void>();
    vi.mocked(window.electronAPI.updateUserSettings).mockReturnValueOnce(
      promise,
    );

    let id: string | undefined;
    act(() => {
      id = result.current.quickfilters[0]?.id;
      if (id) {
        result.current.deleteQuickfilter(id);
      }
    });

    expect(result.current.quickfilters).toEqual([]);

    resolve();
    await act(async () => {
      await promise;
    });
  });

  it('lists quickfilters in creation order regardless of use', async () => {
    const { result } = await renderHook(() => useQuickfilters('attribution'));
    const first = faker.string.sample();
    const second = faker.string.sample();

    await act(async () => {
      result.current.saveQuickfilter(first, initialAttributionFilters);
      await Promise.resolve();
    });
    await act(async () => {
      result.current.saveQuickfilter(second, initialAttributionFilters);
      await Promise.resolve();
    });

    expect(result.current.quickfilters.map(({ name }) => name)).toEqual([
      first,
      second,
    ]);
  });

  it('reorders within the scope and keeps other scopes in place', async () => {
    const first = makeQuickfilter({ name: 'A', scope: 'attribution' });
    const signalQuickfilter = makeQuickfilter({ name: 'S', scope: 'signal' });
    const second = makeQuickfilter({ name: 'B', scope: 'attribution' });
    const third = makeQuickfilter({ name: 'C', scope: 'attribution' });
    const { result, store } = await renderHook(
      () => useQuickfilters('attribution'),
      {
        actions: [
          setUserSetting({
            savedQuickfilters: [first, signalQuickfilter, second, third],
          }),
        ],
      },
    );

    await act(async () => {
      result.current.reorderQuickfilter(third.id, 1);
      await Promise.resolve();
    });

    expect(result.current.quickfilters.map(({ name }) => name)).toEqual([
      'A',
      'C',
      'B',
    ]);
    expect(
      store
        .getState()
        .userSettingsState.savedQuickfilters.map(({ name }) => name),
    ).toEqual(['A', 'S', 'C', 'B']);
  });
});
