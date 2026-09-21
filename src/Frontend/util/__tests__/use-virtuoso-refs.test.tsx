// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, renderHook } from '@testing-library/react';
import type { VirtuosoHandle } from 'react-virtuoso';

import { useVirtuosoRefs } from '../use-virtuoso-refs';

interface Item {
  id: string;
}

interface HookProps {
  data: ReadonlyArray<Item> | null;
  selectedId: string | undefined;
}

const item = (id: string): Item => ({ id });

const virtuosoHandle = (scrollIntoView: VirtuosoHandle['scrollIntoView']) =>
  ({
    autoscrollToBottom: vi.fn(),
    getState: vi.fn(),
    scrollBy: vi.fn(),
    scrollIntoView,
    scrollTo: vi.fn(),
    scrollToIndex: vi.fn(),
  }) satisfies VirtuosoHandle;

describe('useVirtuosoRefs', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not scroll when rows move around an unchanged selection', async () => {
    const scrollIntoView = vi.fn();
    const { result, rerender } = renderHook<
      ReturnType<typeof useVirtuosoRefs>,
      HookProps
    >(({ data, selectedId }) => useVirtuosoRefs({ data, selectedId }), {
      initialProps: {
        data: [item('before'), item('selected')],
        selectedId: 'selected',
      },
    });
    result.current.ref.current = virtuosoHandle(scrollIntoView);
    await act(() => vi.runAllTimers());
    scrollIntoView.mockClear();

    rerender({
      data: [item('inserted'), item('before'), item('selected')],
      selectedId: 'selected',
    });
    await act(() => vi.runAllTimers());

    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender({ data: [item('selected')], selectedId: 'selected' });
    await act(() => vi.runAllTimers());

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('scrolls when the selected ID changes even at the same index', async () => {
    const scrollIntoView = vi.fn();
    const { result, rerender } = renderHook<
      ReturnType<typeof useVirtuosoRefs>,
      HookProps
    >(({ data, selectedId }) => useVirtuosoRefs({ data, selectedId }), {
      initialProps: {
        data: [item('first'), item('second')],
        selectedId: 'first',
      },
    });
    result.current.ref.current = virtuosoHandle(scrollIntoView);
    await act(() => vi.runAllTimers());
    scrollIntoView.mockClear();

    rerender({
      data: [item('replacement'), item('second')],
      selectedId: 'replacement',
    });
    await act(() => vi.runAllTimers());

    expect(scrollIntoView).toHaveBeenCalledWith({ index: 0, align: 'center' });
  });

  it('scrolls initial and newly available selections into view', async () => {
    const scrollIntoView = vi.fn();
    const { result, rerender } = renderHook<
      ReturnType<typeof useVirtuosoRefs>,
      HookProps
    >(({ data, selectedId }) => useVirtuosoRefs({ data, selectedId }), {
      initialProps: {
        data: null,
        selectedId: 'loaded',
      },
    });
    result.current.ref.current = virtuosoHandle(scrollIntoView);
    await act(() => vi.runAllTimers());
    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender({ data: [item('other'), item('loaded')], selectedId: 'loaded' });
    await act(() => vi.runAllTimers());

    expect(scrollIntoView).toHaveBeenCalledWith({ index: 1, align: 'center' });
  });

  it('does not scroll missing or cleared selections', async () => {
    const scrollIntoView = vi.fn();
    const { result, rerender } = renderHook<
      ReturnType<typeof useVirtuosoRefs>,
      HookProps
    >(({ data, selectedId }) => useVirtuosoRefs({ data, selectedId }), {
      initialProps: {
        data: [item('available')],
        selectedId: 'missing',
      },
    });
    result.current.ref.current = virtuosoHandle(scrollIntoView);
    await act(() => vi.runAllTimers());

    rerender({ data: [item('available')], selectedId: undefined });
    await act(() => vi.runAllTimers());

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('cancels a deferred scroll when its dependencies change', async () => {
    const scrollIntoView = vi.fn();
    const { result, rerender } = renderHook<
      ReturnType<typeof useVirtuosoRefs>,
      HookProps
    >(({ data, selectedId }) => useVirtuosoRefs({ data, selectedId }), {
      initialProps: { data: [item('first')], selectedId: 'first' },
    });
    result.current.ref.current = virtuosoHandle(scrollIntoView);

    rerender({ data: [item('second')], selectedId: 'second' });
    await act(() => vi.runAllTimers());

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ index: 0, align: 'center' });
  });

  it('cancels a deferred scroll when the hook unmounts', async () => {
    const scrollIntoView = vi.fn();
    const { result, unmount } = renderHook<
      ReturnType<typeof useVirtuosoRefs>,
      HookProps
    >(({ data, selectedId }) => useVirtuosoRefs({ data, selectedId }), {
      initialProps: { data: [item('selected')], selectedId: 'selected' },
    });
    result.current.ref.current = virtuosoHandle(scrollIntoView);

    unmount();
    await act(() => vi.runAllTimers());

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
