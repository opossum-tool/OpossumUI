// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act } from '@testing-library/react';

import { faker } from '../../../../testing/Faker';
import { renderHook } from '../../../test-helpers/render';
import {
  type AttributionFilters,
  initialAttributionFilters,
} from '../use-filters';
import { useQuickfilters } from '../use-quickfilters';

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

    await act(async () => {
      result.current.saveQuickfilter(name, filters);
      await Promise.resolve();
    });

    expect(result.current.quickfilters).toHaveLength(1);
    expect(result.current.quickfilters[0]).toMatchObject({
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
