// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act, type Ref, useImperativeHandle } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';

import { renderComponent } from '../../../test-helpers/render';
import { List } from '../List';

const virtuosoMock = vi.hoisted(() => ({
  itemsRendered: undefined as
    ((items: ReadonlyArray<{ size: number }>) => void) | undefined,
  scrollIntoView: vi.fn(),
  rangeChanged: undefined as
    ((range: { startIndex: number; endIndex: number }) => void) | undefined,
  endReached: undefined as ((index: number) => void) | undefined,
}));

vi.mock('react-virtuoso', async (importOriginal) => {
  const original = await importOriginal<object>();

  return {
    ...original,
    Virtuoso: ({
      itemsRendered,
      rangeChanged,
      endReached,
      ref,
    }: {
      itemsRendered?: (items: ReadonlyArray<{ size: number }>) => void;
      rangeChanged?: (range: { startIndex: number; endIndex: number }) => void;
      endReached?: (index: number) => void;
      ref?: Ref<VirtuosoHandle>;
    }) => {
      useImperativeHandle(ref, () => ({
        autoscrollToBottom: vi.fn(),
        getState: vi.fn(),
        scrollBy: vi.fn(),
        scrollIntoView: virtuosoMock.scrollIntoView,
        scrollTo: vi.fn(),
        scrollToIndex: vi.fn(),
      }));
      virtuosoMock.itemsRendered = itemsRendered;
      virtuosoMock.rangeChanged = rangeChanged;
      virtuosoMock.endReached = endReached;
      return <div />;
    },
  };
});

beforeEach(() => {
  virtuosoMock.itemsRendered = undefined;
  virtuosoMock.rangeChanged = undefined;
  virtuosoMock.endReached = undefined;
  virtuosoMock.scrollIntoView.mockClear();
});

function invokeItemsRendered(items: ReadonlyArray<{ size: number }>) {
  act(() => virtuosoMock.itemsRendered?.(items));
}

function invokeRangeChanged(range: { startIndex: number; endIndex: number }) {
  act(() => virtuosoMock.rangeChanged?.(range));
}

describe('List selection scrolling', () => {
  it.each([
    ['one row', [{ size: 24 }]],
    ['multiple rows', [{ size: 24 }, { size: 24 }, { size: 24 }]],
  ])('scrolls after %s are measured', async (_description, measuredRows) => {
    await renderComponent(
      <List
        data={[
          { id: 'first' },
          { id: 'second' },
          { id: 'third' },
          { id: 'selected' },
        ]}
        selectedId="selected"
        renderItemContent={(item) => <div>{item.id}</div>}
      />,
    );

    invokeItemsRendered(measuredRows);

    expect(virtuosoMock.scrollIntoView).toHaveBeenCalledWith({
      index: 3,
      align: 'center',
    });
  });

  it('does not scroll after zero-size rows are reported', async () => {
    await renderComponent(
      <List
        data={[{ id: 'first' }, { id: 'selected' }]}
        selectedId="selected"
        renderItemContent={(item) => <div>{item.id}</div>}
      />,
    );

    invokeItemsRendered([{ size: 0 }]);

    expect(virtuosoMock.scrollIntoView).not.toHaveBeenCalled();
  });

  it('resets readiness when data is cleared and repopulated', async () => {
    const renderList = (data: ReadonlyArray<{ id: string }> | null) => (
      <List
        data={data}
        selectedId="selected"
        renderItemContent={(item) => <div>{item.id}</div>}
      />
    );
    const view = await renderComponent(
      renderList([{ id: 'first' }, { id: 'selected' }]),
    );

    invokeItemsRendered([{ size: 24 }]);
    expect(virtuosoMock.scrollIntoView).toHaveBeenCalledTimes(1);

    virtuosoMock.scrollIntoView.mockClear();
    view.rerender(renderList(null));
    view.rerender(renderList([{ id: 'first' }, { id: 'selected' }]));
    expect(virtuosoMock.scrollIntoView).not.toHaveBeenCalled();

    invokeItemsRendered([{ size: 0 }]);
    expect(virtuosoMock.scrollIntoView).not.toHaveBeenCalled();
    invokeItemsRendered([{ size: 24 }]);
    expect(virtuosoMock.scrollIntoView).toHaveBeenCalledTimes(1);
  });
});

describe('List pagination', () => {
  it('forwards rendered items and caller callbacks', async () => {
    const onItemsRendered = vi.fn();
    const onRangeChanged = vi.fn();
    await renderComponent(
      <List
        data={[{ id: 'first' }, { id: 'selected' }]}
        selectedId="selected"
        itemsRendered={onItemsRendered}
        rangeChanged={onRangeChanged}
        renderItemContent={(item) => <div>{item.id}</div>}
      />,
    );

    invokeItemsRendered([{ size: 0 }]);
    expect(virtuosoMock.scrollIntoView).not.toHaveBeenCalled();
    invokeItemsRendered([{ size: 24 }]);
    invokeRangeChanged({ startIndex: 0, endIndex: 0 });

    expect(onItemsRendered).toHaveBeenNthCalledWith(1, [{ size: 0 }]);
    expect(onItemsRendered).toHaveBeenNthCalledWith(2, [{ size: 24 }]);
    expect(onRangeChanged).toHaveBeenCalledWith({ startIndex: 0, endIndex: 0 });
    expect(virtuosoMock.scrollIntoView).toHaveBeenCalledWith({
      index: 1,
      align: 'center',
    });
  });

  it.each([
    ['without totalCount', undefined, [{ id: 'first' }, { id: 'last' }]],
    ['when all counted rows are loaded', 2, [{ id: 'first' }, { id: 'last' }]],
  ])('forwards endReached %s', async (_description, totalCount, data) => {
    const fetchNextPage = vi.fn();
    await renderComponent(
      <List
        data={data}
        totalCount={totalCount}
        unloadedItemHeight={1}
        endReached={fetchNextPage}
        renderItemContent={(item) => <div>{item.id}</div>}
      />,
    );

    expect(virtuosoMock.endReached).toBe(fetchNextPage);
    act(() => virtuosoMock.endReached?.(1));
    expect(fetchNextPage).toHaveBeenCalledWith(1);
  });

  it('disables Virtuoso endReached while unloaded rows exist', async () => {
    await renderComponent(
      <List
        data={[{ id: 'loaded' }]}
        totalCount={2}
        unloadedItemHeight={1}
        endReached={vi.fn()}
        renderItemContent={(item) => <div>{item.id}</div>}
      />,
    );

    expect(virtuosoMock.endReached).toBeUndefined();
  });

  it('keeps the retry control visible for a visible unloaded range', async () => {
    const onRetryLoadMore = vi.fn();
    await renderComponent(
      <List
        data={[{ id: 'loaded' }]}
        totalCount={20}
        unloadedItemHeight={1}
        loadMoreError={new Error('request failed')}
        onRetryLoadMore={onRetryLoadMore}
        renderItemContent={(item) => <div>{item.id}</div>}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Retry' }),
    ).not.toBeInTheDocument();

    invokeRangeChanged({ startIndex: 10, endIndex: 15 });

    const retryButton = await screen.findByRole('button', { name: 'Retry' });
    await userEvent.click(retryButton);
    expect(onRetryLoadMore).toHaveBeenCalledWith(15);
  });

  it('discards the observed range when the result set is cleared', async () => {
    const fetchNextPage = vi.fn();
    const renderList = (
      data: ReadonlyArray<{ id: string }> | null,
      loadingMore = false,
      resultSetKey = 'result-set',
    ) => (
      <List
        data={data}
        resultSetKey={resultSetKey}
        totalCount={20}
        unloadedItemHeight={1}
        loadingMore={loadingMore}
        endReached={fetchNextPage}
        renderItemContent={(item) => <div>{item.id}</div>}
      />
    );
    const { rerender } = await renderComponent(
      renderList([{ id: 'old-result' }], true),
    );

    invokeRangeChanged({ startIndex: 10, endIndex: 15 });
    expect(fetchNextPage).not.toHaveBeenCalled();

    rerender(renderList(null));
    rerender(
      renderList(
        Array.from({ length: 10 }, (_, index) => ({ id: `new-${index}` })),
      ),
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('ignores an observed range from another result set', async () => {
    const fetchNextPage = vi.fn();
    const renderList = (
      data: ReadonlyArray<{ id: string }>,
      resultSetKey: string,
      loadingMore = false,
    ) => (
      <List
        data={data}
        resultSetKey={resultSetKey}
        totalCount={20}
        unloadedItemHeight={1}
        loadingMore={loadingMore}
        endReached={fetchNextPage}
        renderItemContent={(item) => <div>{item.id}</div>}
      />
    );
    const { rerender } = await renderComponent(
      renderList([{ id: 'old-result' }], 'old', true),
    );

    invokeRangeChanged({ startIndex: 10, endIndex: 15 });

    rerender(
      renderList(
        Array.from({ length: 10 }, (_, index) => ({ id: `new-${index}` })),
        'new',
      ),
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
