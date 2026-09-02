// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderComponent } from '../../../test-helpers/render';
import { GroupedList } from '../GroupedList';

const virtuosoMock = vi.hoisted(() => ({
  rangeChanged: undefined as
    ((range: { startIndex: number; endIndex: number }) => void) | undefined,
}));

vi.mock('react-virtuoso', async (importOriginal) => {
  const original = await importOriginal<object>();

  return {
    ...original,
    GroupedVirtuoso: ({
      rangeChanged,
    }: {
      rangeChanged?: (range: { startIndex: number; endIndex: number }) => void;
    }) => {
      virtuosoMock.rangeChanged = rangeChanged;
      return <div />;
    },
  };
});

describe('GroupedList pagination', () => {
  it('keeps the retry control visible for a visible unloaded range', async () => {
    const onRetryLoadMore = vi.fn();
    await renderComponent(
      <GroupedList
        grouped={{ source: ['loaded'] }}
        totalCount={20}
        unloadedItemHeight={1}
        loadMoreError={new Error('request failed')}
        onRetryLoadMore={onRetryLoadMore}
        renderItemContent={(id) => <div>{id}</div>}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Retry' }),
    ).not.toBeInTheDocument();

    act(() => {
      virtuosoMock.rangeChanged?.({ startIndex: 10, endIndex: 15 });
    });

    const retryButton = await screen.findByRole('button', { name: 'Retry' });
    await userEvent.click(retryButton);
    expect(onRetryLoadMore).toHaveBeenCalledWith(15);
  });

  it('discards the observed range when the result set is cleared', async () => {
    const fetchNextPage = vi.fn();
    const renderList = (
      grouped: Record<string, ReadonlyArray<string>> | null,
      loadingMore = false,
      resultSetKey = 'result-set',
    ) => (
      <GroupedList
        grouped={grouped}
        resultSetKey={resultSetKey}
        totalCount={20}
        unloadedItemHeight={1}
        loadingMore={loadingMore}
        endReached={fetchNextPage}
        renderItemContent={(id) => <div>{id}</div>}
      />
    );
    const { rerender } = await renderComponent(
      renderList({ old: ['old-result'] }, true),
    );

    act(() => {
      virtuosoMock.rangeChanged?.({ startIndex: 10, endIndex: 15 });
    });
    expect(fetchNextPage).not.toHaveBeenCalled();

    rerender(renderList(null));
    rerender(
      renderList({
        new: Array.from({ length: 10 }, (_, index) => `new-${index}`),
      }),
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('ignores an observed range from another result set', async () => {
    const fetchNextPage = vi.fn();
    const renderList = (
      grouped: Record<string, ReadonlyArray<string>>,
      resultSetKey: string,
      loadingMore = false,
    ) => (
      <GroupedList
        grouped={grouped}
        resultSetKey={resultSetKey}
        totalCount={20}
        unloadedItemHeight={1}
        loadingMore={loadingMore}
        endReached={fetchNextPage}
        renderItemContent={(id) => <div>{id}</div>}
      />
    );
    const { rerender } = await renderComponent(
      renderList({ old: ['old-result'] }, 'old', true),
    );

    act(() => {
      virtuosoMock.rangeChanged?.({ startIndex: 10, endIndex: 15 });
    });

    rerender(
      renderList(
        {
          new: Array.from({ length: 10 }, (_, index) => `new-${index}`),
        },
        'new',
      ),
    );

    expect(fetchNextPage).not.toHaveBeenCalled();
  });
});
