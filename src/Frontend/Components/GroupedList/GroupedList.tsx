// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import MuiBox from '@mui/material/Box';
import MuiTooltip from '@mui/material/Tooltip';
import type { SxProps } from '@mui/system';
import { useEffect, useMemo, useState } from 'react';
import {
  GroupedVirtuoso,
  type GroupedVirtuosoHandle,
  type GroupedVirtuosoProps,
} from 'react-virtuoso';

import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { useVirtuosoRefs } from '../../util/use-virtuoso-refs';
import { EmptyPlaceholder } from '../EmptyPlaceholder/EmptyPlaceholder';
import {
  FloatingInfiniteListFooter,
  InfiniteListFooter,
  InfiniteListFooterContext,
} from '../List/InfiniteListFooter';
import type { UnloadedItemsProps } from '../List/List';
import { LoadingMask } from '../LoadingMask/LoadingMask';
import { VirtuosoComponentContext } from '../VirtuosoComponentContext/VirtuosoComponentContext';
import { GroupContainer, StyledLinearProgress } from './GroupedList.style';

export interface GroupedListItemContentProps {
  index: number;
  selected: boolean;
  focused: boolean;
}

interface GroupedListProps {
  className?: string;
  grouped: Record<string, ReadonlyArray<string>> | null;
  loading?: boolean;
  loadingMore?: boolean;
  loadMoreError?: unknown;
  onRetryLoadMore?: (requiredEndIndex?: number) => void;
  renderGroupName?: (key: string) => React.ReactNode;
  renderItemContent: (
    datum: string,
    props: GroupedListItemContentProps,
  ) => React.ReactNode;
  resultSetKey?: string;
  selectedId?: string;
  sx?: SxProps;
  testId?: string;
}

export function GroupedList({
  className,
  grouped,
  loading,
  loadingMore = false,
  loadMoreError,
  onRetryLoadMore,
  renderGroupName,
  renderItemContent,
  resultSetKey,
  selectedId,
  sx,
  testId,
  totalCount,
  unloadedItemHeight,
  endReached,
  components,
  ...props
}: GroupedListProps &
  UnloadedItemsProps &
  Omit<GroupedVirtuosoProps<string, unknown>, 'selected'>) {
  // eslint-disable-next-line @eslint-react/use-state
  const [{ startIndex, endIndex }, setRange] = useState<{
    startIndex: number;
    endIndex: number;
  }>({ startIndex: 0, endIndex: 0 });

  const groups = useMemo(() => {
    if (!grouped) {
      return null;
    }

    const flattened = Object.values(grouped).flat();

    const keys = Object.keys(grouped);
    const counts = Object.values(grouped).map((group) => group.length);
    const unloadedCount = Math.max(
      (totalCount ?? flattened.length) - flattened.length,
      0,
    );
    const ids: Array<string | undefined> = [...flattened];
    const syntheticGroupIndex =
      unloadedCount > 0 && keys.length === 0 ? 0 : undefined;

    if (unloadedCount > 0) {
      ids.push(...Array.from({ length: unloadedCount }, () => undefined));
      if (keys.length === 0) {
        keys.push('');
        counts.push(unloadedCount);
      } else {
        counts[counts.length - 1] += unloadedCount;
      }
    }

    return { ids, keys, counts, syntheticGroupIndex };
  }, [grouped, totalCount]);

  const loadedItemCount = Object.values(grouped ?? {}).reduce(
    (count, group) => count + group.length,
    0,
  );
  const [visibleRange, setVisibleRange] = useState<{
    endIndex: number;
    resultSetKey: string | undefined;
  } | null>(null);
  const visibleEndIndex =
    visibleRange !== null && visibleRange.resultSetKey === resultSetKey
      ? visibleRange.endIndex
      : -1;
  const hasUnloadedRows =
    groups !== null && (totalCount ?? loadedItemCount) > loadedItemCount;
  const unloadedRangeVisible =
    hasUnloadedRows && visibleEndIndex >= loadedItemCount;

  useEffect(() => {
    if (grouped === null) {
      setVisibleRange(null);
    }
  }, [grouped]);

  useEffect(() => {
    if (
      !hasUnloadedRows ||
      visibleEndIndex < loadedItemCount ||
      loadingMore ||
      loadMoreError ||
      !endReached
    ) {
      return;
    }
    endReached(visibleEndIndex);
  }, [
    endReached,
    hasUnloadedRows,
    loadMoreError,
    loadedItemCount,
    loadingMore,
    visibleEndIndex,
  ]);

  const {
    ref,
    scrollerRef,
    focusedIndex,
    setIsVirtuosoFocused,
    selectedIndex,
    isVirtuosoFocused,
  } = useVirtuosoRefs<{ id: string }, GroupedVirtuosoHandle>({
    data: groups?.ids
      .slice(0, loadedItemCount)
      .filter((id): id is string => id !== undefined)
      .map((id) => ({ id })),
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
      {groups && (
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
            <GroupedVirtuoso
              ref={ref}
              onFocus={() => setIsVirtuosoFocused(true)}
              onBlur={() => setIsVirtuosoFocused(false)}
              components={{
                EmptyPlaceholder,
                ...(!hasUnloadedRows ? { Footer: InfiniteListFooter } : {}),
                ...components,
              }}
              tabIndex={-1}
              scrollerRef={scrollerRef}
              rangeChanged={(range) => {
                setRange(range);
                setVisibleRange({
                  endIndex: range.endIndex,
                  resultSetKey,
                });
              }}
              endReached={hasUnloadedRows ? undefined : endReached}
              groupCounts={groups?.counts}
              groupContent={(index) =>
                groups.syntheticGroupIndex === index ? (
                  <GroupContainer
                    role={'group'}
                    sx={{
                      height: 0,
                      padding: 0,
                    }}
                  />
                ) : (
                  <GroupContainer role={'group'}>
                    <MuiBox sx={{ display: 'flex' }}>
                      {renderJumpUp(index)}
                      {renderJumpDown(index)}
                    </MuiBox>
                    {renderGroupName?.(groups.keys[index]) || (
                      <MuiBox sx={{ flex: 1 }} />
                    )}
                  </GroupContainer>
                )
              }
              itemContent={(index) =>
                groups.ids[index] ? (
                  renderItemContent(groups.ids[index], {
                    index,
                    selected: index === selectedIndex,
                    focused: index === focusedIndex,
                  })
                ) : (
                  <MuiBox sx={{ height: unloadedItemHeight }} />
                )
              }
              {...props}
            />
            {unloadedRangeVisible && <FloatingInfiniteListFooter />}
          </InfiniteListFooterContext>
        </VirtuosoComponentContext>
      )}
    </LoadingMask>
  );

  function renderJumpUp(index: number) {
    if (!groups) {
      return null;
    }

    const isFirstGroup = index === 0;
    const isFirstItemVisible = startIndex === 0;
    const isFirstItemInGroupVisible =
      startIndex <= groups.counts.slice(0, index).reduce((a, b) => a + b, 0);
    const Icon = isFirstGroup ? KeyboardDoubleArrowUpIcon : KeyboardArrowUpIcon;
    const disabled = isFirstGroup && isFirstItemVisible;

    return (
      <MuiTooltip
        title={
          isFirstGroup
            ? isFirstItemVisible
              ? undefined
              : text.packageLists.scrollToTop
            : isFirstItemInGroupVisible
              ? text.packageLists.jumpPrevious
              : text.packageLists.jumpStart
        }
        enterDelay={500}
      >
        <Icon
          sx={{
            cursor: disabled ? undefined : 'pointer',
            borderRadius: '50%',
            '&:hover': {
              background: disabled ? undefined : OpossumColors.lightGrey,
            },
          }}
          fontSize={'inherit'}
          color={disabled ? 'disabled' : undefined}
          onClick={
            isFirstGroup
              ? isFirstItemVisible
                ? undefined
                : () => ref.current?.scrollToIndex({ index: 0 })
              : () =>
                  ref.current?.scrollToIndex({
                    groupIndex: isFirstItemInGroupVisible ? index - 1 : index,
                  })
          }
        />
      </MuiTooltip>
    );
  }

  function renderJumpDown(index: number) {
    if (!groups) {
      return null;
    }

    const isLastGroup = index === groups.counts.length - 1;
    const isLastItemVisible = endIndex === groups.ids.length - 1;
    const Icon = isLastGroup
      ? KeyboardDoubleArrowDownIcon
      : KeyboardArrowDownIcon;
    const disabled = isLastGroup && isLastItemVisible;

    return (
      <MuiTooltip
        title={
          isLastGroup
            ? isLastItemVisible
              ? undefined
              : text.packageLists.scrollToBottom
            : text.packageLists.jumpNext
        }
        enterDelay={500}
      >
        <Icon
          sx={{
            cursor: disabled ? undefined : 'pointer',
            borderRadius: '50%',
            '&:hover': {
              background: disabled ? undefined : OpossumColors.lightGrey,
            },
          }}
          fontSize={'inherit'}
          color={disabled ? 'disabled' : undefined}
          onClick={
            isLastGroup
              ? isLastItemVisible
                ? undefined
                : () => ref.current?.scrollToIndex({ index: 'LAST' })
              : () => ref.current?.scrollToIndex({ groupIndex: index + 1 })
          }
        />
      </MuiTooltip>
    );
  }
}
