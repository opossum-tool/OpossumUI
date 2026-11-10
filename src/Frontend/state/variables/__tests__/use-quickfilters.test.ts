// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act } from '@testing-library/react';

import type { SavedQuickfilter } from '../../../../shared/shared-types';
import { faker } from '../../../../testing/Faker';
import { renderHook } from '../../../test-helpers/render';
import {
  type AttributionFilters,
  initialAttributionFilters,
} from '../use-filters';
import {
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
  filters = { filters: [], search: '', valueFilters: {} },
}: {
  id?: string;
  name?: string;
  filters?: SavedQuickfilter['filters'];
} = {}): SavedQuickfilter {
  return {
    id,
    name,
    lastUsedAt: faker.number.int(),
    scope: 'attribution',
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

  it('marks a quickfilter as used and sorts by most recent use', async () => {
    let currentTime = 1000;
    const nowSpy = vi
      .spyOn(Date, 'now')
      .mockImplementation(() => ++currentTime);
    const { result } = await renderHook(() => useQuickfilters('attribution'));
    const first = faker.string.sample();
    const second = faker.string.sample();

    try {
      await act(async () => {
        result.current.saveQuickfilter(first, initialAttributionFilters);
        await Promise.resolve();
      });
      await act(async () => {
        result.current.saveQuickfilter(second, initialAttributionFilters);
        await Promise.resolve();
      });
      expect(result.current.quickfilters.map(({ name }) => name)).toEqual([
        second,
        first,
      ]);

      await act(async () => {
        result.current.markQuickfilterUsed(result.current.quickfilters[1].id);
        await Promise.resolve();
      });
    } finally {
      nowSpy.mockRestore();
    }

    expect(result.current.quickfilters.map(({ name }) => name)).toEqual([
      first,
      second,
    ]);
  });
});
