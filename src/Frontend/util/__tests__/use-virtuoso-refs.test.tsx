// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render } from '@testing-library/react';
import { type Ref, useImperativeHandle } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';

import { useVirtuosoRefs } from '../use-virtuoso-refs';

interface Item {
  id: string;
}

interface HookProps {
  data: ReadonlyArray<Item> | null;
  selectedId: string | undefined;
}

interface VirtuosoHarnessProps {
  handle: VirtuosoHandle;
  ref: Ref<VirtuosoHandle>;
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

function VirtuosoHarness({ handle, ref }: VirtuosoHarnessProps) {
  useImperativeHandle(ref, () => handle, [handle]);
  return null;
}

function SelectionScrollHarness({
  data,
  handle,
  selectedId,
}: HookProps & Pick<VirtuosoHarnessProps, 'handle'>) {
  const { ref } = useVirtuosoRefs({ data, selectedId });

  return <VirtuosoHarness ref={ref} handle={handle} />;
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
    expect(scrollIntoView).toHaveBeenCalledWith({ index: 1, align: 'center' });
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
    expect(scrollIntoView).toHaveBeenCalledWith({ index: 0, align: 'center' });
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
    expect(scrollIntoView).toHaveBeenCalledWith({ index: 1, align: 'center' });
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
    expect(scrollIntoView).toHaveBeenCalledWith({ index: 1, align: 'center' });
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
