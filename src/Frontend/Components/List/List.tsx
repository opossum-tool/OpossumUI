// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { SxProps } from '@mui/system';
import { useEffect, useState } from 'react';
import {
  Virtuoso,
  type VirtuosoHandle,
  type VirtuosoProps,
} from 'react-virtuoso';

import { useVirtuosoRefs } from '../../util/use-virtuoso-refs';
import { EmptyPlaceholder } from '../EmptyPlaceholder/EmptyPlaceholder';
import { LoadingMask } from '../LoadingMask/LoadingMask';
import { VirtuosoComponentContext } from '../VirtuosoComponentContext/VirtuosoComponentContext';
import {
  FloatingInfiniteListFooter,
  InfiniteListFooter,
  InfiniteListFooterContext,
} from './InfiniteListFooter';
import { StyledLinearProgress } from './List.style';

export const INFINITE_LIST_BOTTOM_OVERSCAN = 600;

export interface ListItemContentProps {
  index: number;
  selected: boolean;
  focused: boolean;
}

export type BaseItem = { id: unknown };

export type UnloadedItemsProps =
  | {
      totalCount?: never;
      unloadedItemHeight?: never;
    }
  | {
      totalCount: number | undefined;
      unloadedItemHeight: number;
    };

interface ListProps<ItemType extends BaseItem> {
  className?: string;
  data: ReadonlyArray<ItemType> | null;
  loading?: boolean;
  loadingMore?: boolean;
  loadMoreError?: unknown;
  onRetryLoadMore?: (requiredEndIndex?: number) => void;
  renderItemContent: (
    datum: ItemType,
    props: ListItemContentProps,
  ) => React.ReactNode;
  resultSetKey?: string;
  selectedId?: string;
  sx?: SxProps;
  testId?: string;
}

export function List<ItemType extends BaseItem>({
  className,
  data,
  loading,
  loadingMore = false,
  loadMoreError,
  onRetryLoadMore,
  renderItemContent,
  resultSetKey,
  selectedId,
  sx,
  testId,
  components,
  initialTopMostItemIndex,
  totalCount,
  unloadedItemHeight,
  ...props
}: ListProps<ItemType> &
  UnloadedItemsProps &
  Omit<VirtuosoProps<ItemType, unknown>, 'data' | 'selected' | 'totalCount'>) {
  const { endReached, rangeChanged } = props;
  const [visibleRange, setVisibleRange] = useState<{
    endIndex: number;
    resultSetKey: string | undefined;
  } | null>(null);
  const visibleEndIndex =
    visibleRange !== null && visibleRange.resultSetKey === resultSetKey
      ? visibleRange.endIndex
      : -1;
  const hasUnloadedRows =
    data !== null && totalCount !== undefined && totalCount > data.length;
  const unloadedRangeVisible =
    hasUnloadedRows && visibleEndIndex >= (data?.length ?? 0);
  const effectiveTotalCount =
    totalCount === undefined
      ? undefined
      : Math.max(totalCount, data?.length ?? 0);
  const virtuosoData =
    data === null
      ? undefined
      : effectiveTotalCount === undefined
        ? data
        : [...data, ...Array<ItemType>(effectiveTotalCount - data.length)];

  useEffect(() => {
    if (data === null) {
      setVisibleRange(null);
    }
  }, [data]);

  useEffect(() => {
    if (
      !hasUnloadedRows ||
      visibleEndIndex < (data?.length ?? 0) ||
      loadingMore ||
      loadMoreError ||
      !endReached
    ) {
      return;
    }
    endReached(visibleEndIndex);
  }, [
    data?.length,
    hasUnloadedRows,
    loadMoreError,
    loadingMore,
    endReached,
    visibleEndIndex,
  ]);
  const {
    focusedIndex,
    ref,
    scrollerRef,
    setIsVirtuosoFocused,
    selectedIndex,
    isVirtuosoFocused,
  } = useVirtuosoRefs<ItemType, VirtuosoHandle>({
    data,
    selectedId,
  });

  return (
    <LoadingMask
      className={className}
      sx={{ position: 'relative', ...sx }}
      active={loading}
      testId={testId}
    >
      {loading && <StyledLinearProgress data-testid={'loading'} />}
      {data && (
        // Virtuoso components must not be inlined: https://github.com/petyosi/react-virtuoso/issues/566
        <VirtuosoComponentContext value={{ isVirtuosoFocused, loading }}>
          <InfiniteListFooterContext
            value={{
              loading: loadingMore,
              error: loadMoreError,
              onRetry: () =>
                onRetryLoadMore?.(
                  visibleEndIndex >= 0 ? visibleEndIndex : undefined,
                ),
            }}
          >
            <Virtuoso
              {...props}
              ref={ref}
              onFocus={() => setIsVirtuosoFocused(true)}
              onBlur={() => setIsVirtuosoFocused(false)}
              tabIndex={-1}
              components={{
                EmptyPlaceholder,
                ...(!hasUnloadedRows ? { Footer: InfiniteListFooter } : {}),
                ...components,
              }}
              scrollerRef={scrollerRef}
              data={virtuosoData}
              {...(effectiveTotalCount === undefined
                ? {}
                : {
                    totalCount: effectiveTotalCount,
                    rangeChanged: (range) => {
                      setVisibleRange({
                        endIndex: range.endIndex,
                        resultSetKey,
                      });
                      rangeChanged?.(range);
                    },
                    endReached: hasUnloadedRows ? undefined : endReached,
                  })}
              itemContent={(index) =>
                hasUnloadedRows && !data?.[index] ? (
                  <div style={{ height: unloadedItemHeight }} />
                ) : (
                  renderItemContent(data[index], {
                    index,
                    selected: index === selectedIndex,
                    focused: index === focusedIndex,
                  })
                )
              }
              initialTopMostItemIndex={initialTopMostItemIndex}
            />
            {unloadedRangeVisible && <FloatingInfiniteListFooter />}
          </InfiniteListFooterContext>
        </VirtuosoComponentContext>
      )}
    </LoadingMask>
  );
}
