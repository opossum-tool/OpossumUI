// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render } from '@testing-library/react';
import { type Ref, useEffect, useImperativeHandle } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';

import { useVirtuosoRefs } from '../use-virtuoso-refs';

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches: false,
  } as MediaQueryList);
});

afterEach(() => {
  vi.restoreAllMocks();
});

interface Item {
  id: string | undefined;
}

interface HookProps {
  data: ReadonlyArray<Item> | null;
  isListReady?: boolean;
  selectedId: string | undefined;
  resultSetKey?: string;
  scrollBehavior?: 'auto' | 'smooth';
  viewportTopOffset?: number;
}

interface VirtuosoHarnessProps {
  handle: VirtuosoHandle;
  ref: Ref<VirtuosoHandle>;
}

const item = (id: string | undefined): Item => ({ id });

const virtuosoHandle = (scrollIntoView: VirtuosoHandle['scrollIntoView']) =>
  ({
    autoscrollToBottom: vi.fn(),
    getState: vi.fn(),
    scrollBy: vi.fn(),
    scrollIntoView,
    scrollTo: vi.fn(),
    scrollToIndex: vi.fn(),
  }) satisfies VirtuosoHandle;

function VirtuosoHarness({ handle, ref }: VirtuosoHarnessProps) {
  useImperativeHandle(ref, () => handle, [handle]);
  return null;
}

function SelectionScrollHarness({
  data,
  handle,
  isListReady,
  resultSetKey,
  selectedId,
  scrollBehavior,
  viewportTopOffset,
}: HookProps & Pick<VirtuosoHarnessProps, 'handle'>) {
  const { ref, scrollerRef, setIsVirtuosoFocused } = useVirtuosoRefs({
    data,
    isListReady,
    resultSetKey,
    selectedId,
    scrollBehavior,
    viewportTopOffset,
  });

  useEffect(() => {
    scrollerRef(window);
    setIsVirtuosoFocused(true);
    return () => scrollerRef(null);
  }, [scrollerRef, setIsVirtuosoFocused]);

  return (
    <div onFocus={() => setIsVirtuosoFocused(true)} tabIndex={0}>
      <VirtuosoHarness ref={ref} handle={handle} />
    </div>
  );
}

const renderHarness = (
  props: HookProps,
  scrollIntoView: VirtuosoHandle['scrollIntoView'],
) =>
  render(
    <SelectionScrollHarness
      {...props}
      handle={virtuosoHandle(scrollIntoView)}
    />,
  );

describe('useVirtuosoRefs', () => {
  it('requests a viewport-preserving position for an already-visible row without an offset', () => {
    const scrollIntoView = vi.fn();
    renderHarness(
      { data: [item('selected')], selectedId: 'selected' },
      scrollIntoView,
    );

    const { calculateViewLocation } = scrollIntoView.mock.calls[0][0];
    expect(
      calculateViewLocation({
        itemTop: 120,
        itemBottom: 160,
        viewportTop: 100,
        viewportBottom: 300,
        locationParams: { index: 0, align: 'center', behavior: 'smooth' },
      }),
    ).toEqual({
      index: 0,
      align: 'start',
      behavior: 'auto',
      offset: -20,
    });
  });

  it('uses the viewport top offset when deciding whether an item needs revealing', () => {
    const scrollIntoView = vi.fn();
    renderHarness(
      {
        data: [item('selected')],
        selectedId: 'selected',
        viewportTopOffset: 40,
      },
      scrollIntoView,
    );

    const { calculateViewLocation } = scrollIntoView.mock.calls[0][0];
    expect(
      calculateViewLocation({
        itemTop: 10,
        itemBottom: 50,
        viewportTop: 0,
        viewportBottom: 300,
        locationParams: { index: 0, align: 'center', behavior: 'smooth' },
      }),
    ).toEqual({ index: 0, align: 'center', behavior: 'smooth' });
    expect(
      calculateViewLocation({
        itemTop: 50,
        itemBottom: 90,
        viewportTop: 0,
        viewportBottom: 300,
        locationParams: { index: 0, align: 'center', behavior: 'smooth' },
      }),
    ).toEqual({
      index: 0,
      align: 'start',
      behavior: 'auto',
      offset: -10,
    });
    expect(
      calculateViewLocation({
        itemTop: 40,
        itemBottom: 80,
        viewportTop: 0,
        viewportBottom: 300,
        locationParams: { index: 0, align: 'center', behavior: 'smooth' },
      }),
    ).toEqual({
      index: 0,
      align: 'start',
      behavior: 'auto',
      offset: 0,
    });
    expect(
      calculateViewLocation({
        itemTop: 39,
        itemBottom: 50,
        viewportTop: 0,
        viewportBottom: 300,
        locationParams: { index: 0, behavior: 'smooth' },
      }),
    ).toEqual({ index: 0, align: 'start', behavior: 'smooth' });
    expect(
      calculateViewLocation({
        itemTop: 280,
        itemBottom: 320,
        viewportTop: 0,
        viewportBottom: 300,
        locationParams: { index: 0, behavior: 'smooth' },
      }),
    ).toEqual({ index: 0, align: 'end', behavior: 'smooth' });
  });

  it('scrolls an initially available selection to its index', () => {
    const scrollIntoView = vi.fn();

    renderHarness(
      {
        data: [item('first'), item('selected')],
        selectedId: 'selected',
      },
      scrollIntoView,
    );

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      index: 1,
      align: 'center',
      behavior: 'smooth',
      calculateViewLocation: expect.any(Function),
    });
  });

  it('uses placeholder positions when scrolling to a later grouped item', () => {
    const scrollIntoView = vi.fn();

    renderHarness(
      {
        data: [item('first'), item(undefined), item('later')],
        selectedId: 'later',
      },
      scrollIntoView,
    );

    expect(scrollIntoView).toHaveBeenCalledWith({
      index: 2,
      align: 'center',
      behavior: 'smooth',
      calculateViewLocation: expect.any(Function),
    });
  });

  it('skips unloaded placeholders during immediate keyboard navigation', () => {
    const scrollIntoView = vi.fn();
    renderHarness(
      {
        data: [item('first'), item(undefined), item('later')],
        selectedId: 'first',
      },
      scrollIntoView,
    );

    scrollIntoView.mockClear();
    fireEvent.keyDown(window, { code: 'ArrowDown' });

    expect(scrollIntoView).toHaveBeenCalledWith({
      index: 2,
      behavior: 'auto',
      calculateViewLocation: expect.any(Function),
    });
  });

  it('uses instant scrolling when reduced motion is preferred', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
    } as MediaQueryList);
    const scrollIntoView = vi.fn();
    renderHarness(
      { data: [item('selected')], selectedId: 'selected' },
      scrollIntoView,
    );
    expect(scrollIntoView).toHaveBeenCalledWith({
      index: 0,
      align: 'center',
      behavior: 'auto',
      calculateViewLocation: expect.any(Function),
    });
  });

  it('uses the configured behavior for selection reveals', () => {
    const scrollIntoView = vi.fn();
    renderHarness(
      {
        data: [item('selected')],
        selectedId: 'selected',
        scrollBehavior: 'auto',
      },
      scrollIntoView,
    );

    expect(scrollIntoView).toHaveBeenCalledWith({
      index: 0,
      align: 'center',
      behavior: 'auto',
      calculateViewLocation: expect.any(Function),
    });
  });

  it('keeps keyboard navigation immediate when selection scrolling is smooth', () => {
    const scrollIntoView = vi.fn();
    renderHarness(
      {
        data: [item('first'), item('second')],
        selectedId: 'first',
        scrollBehavior: 'smooth',
      },
      scrollIntoView,
    );

    expect(scrollIntoView).toHaveBeenCalledWith({
      index: 0,
      align: 'center',
      behavior: 'smooth',
      calculateViewLocation: expect.any(Function),
    });
    scrollIntoView.mockClear();
    fireEvent.keyDown(window, { code: 'ArrowDown' });
    expect(scrollIntoView).toHaveBeenCalledWith({
      index: 1,
      behavior: 'auto',
      calculateViewLocation: expect.any(Function),
    });
  });

  it('sends every rapid keyboard move to the newest row', () => {
    const scrollIntoView = vi.fn();
    renderHarness(
      {
        data: [item('first'), item('second'), item('third')],
        selectedId: 'first',
      },
      scrollIntoView,
    );
    scrollIntoView.mockClear();

    fireEvent.keyDown(window, { code: 'ArrowDown' });
    fireEvent.keyDown(window, { code: 'ArrowDown' });

    expect(scrollIntoView).toHaveBeenNthCalledWith(1, {
      index: 1,
      behavior: 'auto',
      calculateViewLocation: expect.any(Function),
    });
    expect(scrollIntoView).toHaveBeenNthCalledWith(2, {
      index: 2,
      behavior: 'auto',
      calculateViewLocation: expect.any(Function),
    });
  });

  it('cancels before each keyboard reveal while preserving window coordinates', () => {
    vi.spyOn(window, 'scrollX', 'get').mockReturnValue(11);
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(23);
    const scrollIntoView = vi.fn();
    const scrollTo = vi.spyOn(window, 'scrollTo');
    renderHarness(
      { data: [item('first'), item('second')], selectedId: 'first' },
      scrollIntoView,
    );
    scrollIntoView.mockClear();
    scrollTo.mockClear();

    fireEvent.keyDown(window, { code: 'ArrowDown' });

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(window.scrollTo).toHaveBeenCalledWith({
      left: window.scrollX,
      top: window.scrollY,
      behavior: 'instant',
    });
    expect(scrollTo.mock.invocationCallOrder[0]).toBeLessThan(
      scrollIntoView.mock.invocationCallOrder[0],
    );
  });

  it('cancels before a changed selection reveal', () => {
    vi.spyOn(window, 'scrollX', 'get').mockReturnValue(11);
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(23);
    const scrollIntoView = vi.fn();
    const scrollTo = vi.spyOn(window, 'scrollTo');
    const props: HookProps = {
      data: [item('first'), item('second')],
      selectedId: 'first',
    };
    const { rerender } = renderHarness(props, scrollIntoView);
    scrollIntoView.mockClear();
    scrollTo.mockClear();

    rerender(
      <SelectionScrollHarness
        {...props}
        selectedId="second"
        handle={virtuosoHandle(scrollIntoView)}
      />,
    );

    expect(window.scrollTo).toHaveBeenCalledWith({
      left: window.scrollX,
      top: window.scrollY,
      behavior: 'instant',
    });
    expect(scrollTo.mock.invocationCallOrder[0]).toBeLessThan(
      scrollIntoView.mock.invocationCallOrder[0],
    );
  });

  it('waits for the virtualized list to be ready before scrolling selection', () => {
    const scrollIntoView = vi.fn();
    const props: HookProps = {
      data: [item('first'), item('selected')],
      isListReady: false,
      selectedId: 'selected',
    };
    const { rerender } = renderHarness(props, scrollIntoView);

    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender(
      <SelectionScrollHarness
        {...props}
        isListReady={true}
        handle={virtuosoHandle(scrollIntoView)}
      />,
    );

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      index: 1,
      align: 'center',
      behavior: 'smooth',
      calculateViewLocation: expect.any(Function),
    });
  });

  it('scrolls when the selected ID changes even at the same index', () => {
    const scrollIntoView = vi.fn();
    const { rerender } = renderHarness(
      {
        data: [item('first'), item('second')],
        selectedId: 'first',
      },
      scrollIntoView,
    );
    scrollIntoView.mockClear();

    rerender(
      <SelectionScrollHarness
        data={[item('replacement'), item('second')]}
        selectedId="replacement"
        handle={virtuosoHandle(scrollIntoView)}
      />,
    );

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      index: 0,
      align: 'center',
      behavior: 'smooth',
      calculateViewLocation: expect.any(Function),
    });
  });

  it('scrolls on A to B to A result-set changes with the same selection', () => {
    const scrollIntoView = vi.fn();
    const props: HookProps = {
      data: [item('selected')],
      isListReady: true,
      resultSetKey: 'result-set-1',
      selectedId: 'selected',
    };
    const { rerender } = renderHarness(props, scrollIntoView);
    scrollIntoView.mockClear();

    rerender(
      <SelectionScrollHarness
        {...props}
        resultSetKey="result-set-2"
        handle={virtuosoHandle(scrollIntoView)}
      />,
    );

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      index: 0,
      align: 'center',
      behavior: 'smooth',
      calculateViewLocation: expect.any(Function),
    });

    scrollIntoView.mockClear();
    rerender(
      <SelectionScrollHarness
        {...props}
        resultSetKey="result-set-1"
        handle={virtuosoHandle(scrollIntoView)}
      />,
    );

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      index: 0,
      align: 'center',
      behavior: 'smooth',
      calculateViewLocation: expect.any(Function),
    });
  });

  it('does not scroll when rows are inserted or removed before an unchanged selection', () => {
    const scrollIntoView = vi.fn();
    const { rerender } = renderHarness(
      {
        data: [item('before'), item('selected')],
        selectedId: 'selected',
      },
      scrollIntoView,
    );
    scrollIntoView.mockClear();

    rerender(
      <SelectionScrollHarness
        data={[item('inserted'), item('before'), item('selected')]}
        selectedId="selected"
        handle={virtuosoHandle(scrollIntoView)}
      />,
    );
    rerender(
      <SelectionScrollHarness
        data={[item('selected')]}
        selectedId="selected"
        handle={virtuosoHandle(scrollIntoView)}
      />,
    );

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('scrolls when a selection becomes available after loading', () => {
    const scrollIntoView = vi.fn();
    const { rerender } = renderHarness(
      { data: null, selectedId: 'loaded' },
      scrollIntoView,
    );
    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender(
      <SelectionScrollHarness
        data={[item('other'), item('loaded')]}
        selectedId="loaded"
        handle={virtuosoHandle(scrollIntoView)}
      />,
    );

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      index: 1,
      align: 'center',
      behavior: 'smooth',
      calculateViewLocation: expect.any(Function),
    });
  });

  it('scrolls when a selection reappears after removal', () => {
    const scrollIntoView = vi.fn();
    const { rerender } = renderHarness(
      { data: [item('selected')], selectedId: 'selected' },
      scrollIntoView,
    );
    scrollIntoView.mockClear();

    rerender(
      <SelectionScrollHarness
        data={[]}
        selectedId="selected"
        handle={virtuosoHandle(scrollIntoView)}
      />,
    );
    expect(scrollIntoView).not.toHaveBeenCalled();

    rerender(
      <SelectionScrollHarness
        data={[item('other'), item('selected')]}
        selectedId="selected"
        handle={virtuosoHandle(scrollIntoView)}
      />,
    );

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      index: 1,
      align: 'center',
      behavior: 'smooth',
      calculateViewLocation: expect.any(Function),
    });
  });

  it('does not scroll for missing data, an absent resource, or an undefined selection', () => {
    const scrollIntoView = vi.fn();
    const { rerender } = renderHarness(
      { data: null, selectedId: 'missing' },
      scrollIntoView,
    );

    rerender(
      <SelectionScrollHarness
        data={[item('available')]}
        selectedId="missing"
        handle={virtuosoHandle(scrollIntoView)}
      />,
    );
    rerender(
      <SelectionScrollHarness
        data={[item('available')]}
        selectedId={undefined}
        handle={virtuosoHandle(scrollIntoView)}
      />,
    );

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it('does not scroll when a previously valid selection is cleared', () => {
    const scrollIntoView = vi.fn();
    const { rerender } = renderHarness(
      { data: [item('selected')], selectedId: 'selected' },
      scrollIntoView,
    );
    scrollIntoView.mockClear();

    rerender(
      <SelectionScrollHarness
        data={[item('selected')]}
        selectedId={undefined}
        handle={virtuosoHandle(scrollIntoView)}
      />,
    );

    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
