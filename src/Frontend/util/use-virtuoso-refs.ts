// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CalculateViewLocation, VirtuosoHandle } from 'react-virtuoso';

export function useVirtuosoRefs<
  ItemType extends { id: unknown },
  T extends VirtuosoHandle,
>({
  data,
  isListReady = true,
  selectedId,
  resultSetKey,
  scrollBehavior = 'smooth',
  viewportTopOffset = 0,
}: {
  data: ReadonlyArray<ItemType> | null | undefined;
  isListReady?: boolean;
  selectedId: ItemType['id'] | undefined;
  resultSetKey?: string;
  scrollBehavior?: 'auto' | 'smooth';
  viewportTopOffset?: number;
}) {
  const ref = useRef<T>(null);
  const listRef = useRef<Window | HTMLElement>(undefined);
  const [isVirtuosoFocused, setIsVirtuosoFocused] = useState(false);
  const [focusedId, setFocusedId] = useState<ItemType['id']>();

  const selectedIndex = useMemo(() => {
    if (!data) {
      return undefined;
    }

    return data.findIndex((datum) => datum.id === selectedId);
  }, [data, selectedId]);

  const focusedIndex = useMemo(() => {
    if (!data || focusedId === undefined) {
      return undefined;
    }

    return data.findIndex((datum) => datum.id === focusedId);
  }, [data, focusedId]);

  const selectedIsAvailable = selectedIndex !== undefined && selectedIndex >= 0;
  useEffect(() => {
    if (isVirtuosoFocused) {
      setFocusedId(selectedId);
    }

    return () => {
      setFocusedId(undefined);
    };
  }, [isVirtuosoFocused, selectedId]);

  const calculateViewLocation = useCallback<CalculateViewLocation>(
    ({ itemTop, itemBottom, viewportTop, viewportBottom, locationParams }) => {
      const visibleTop = viewportTop + viewportTopOffset;

      if (itemTop < visibleTop) {
        return { ...locationParams, align: locationParams.align ?? 'start' };
      }
      if (itemBottom > viewportBottom) {
        return { ...locationParams, align: locationParams.align ?? 'end' };
      }
      return {
        ...locationParams,
        align: 'start',
        behavior: 'auto',
        offset: visibleTop - itemTop,
      };
    },
    [viewportTopOffset],
  );

  const revealIndex = useCallback(
    (index: number, behavior: 'auto' | 'smooth', align?: 'center') => {
      const scroller = listRef.current;
      if (scroller) {
        const isWindow = 'scrollX' in scroller;
        const left = isWindow ? scroller.scrollX : scroller.scrollLeft;
        const top = isWindow ? scroller.scrollY : scroller.scrollTop;
        scroller.scrollTo({ left, top, behavior: 'instant' });
      }
      ref.current?.scrollIntoView({
        index,
        ...(align ? { align } : {}),
        behavior: getScrollBehavior(behavior),
        calculateViewLocation,
      });
    },
    [calculateViewLocation],
  );

  const scrollToSelection = useEffectEvent(() => {
    if (selectedIndex !== undefined && selectedIndex >= 0) {
      revealIndex(selectedIndex, scrollBehavior, 'center');
    }
  });

  useLayoutEffect(() => {
    if (isListReady && selectedId !== undefined && selectedIsAvailable) {
      scrollToSelection();
    }
  }, [isListReady, resultSetKey, selectedId, selectedIsAvailable]);

  const handleKeyDown = useCallback(
    (event: Event) => {
      if (
        data?.length !== undefined &&
        focusedIndex !== undefined &&
        event instanceof KeyboardEvent
      ) {
        let nextIndex: number | null = null;

        if (event.code === 'ArrowUp') {
          for (let index = focusedIndex - 1; index >= 0; index -= 1) {
            if (data[index].id !== undefined) {
              nextIndex = index;
              break;
            }
          }
        } else if (event.code === 'ArrowDown') {
          for (let index = focusedIndex + 1; index < data.length; index += 1) {
            if (data[index].id !== undefined) {
              nextIndex = index;
              break;
            }
          }
        }

        if (nextIndex !== null) {
          const index = nextIndex;
          revealIndex(index, 'auto');
          setFocusedId(data[index].id);
          event.preventDefault();
        }
      }
    },
    [data, focusedIndex, revealIndex],
  );

  const scrollerRef = useCallback(
    (ref: Window | HTMLElement | null) => {
      if (ref) {
        ref.addEventListener('keydown', handleKeyDown);
        listRef.current = ref;
      } else {
        listRef.current?.removeEventListener('keydown', handleKeyDown);
      }
    },
    [handleKeyDown],
  );

  return {
    focusedIndex,
    isVirtuosoFocused,
    ref,
    scrollerRef,
    selectedIndex,
    setIsVirtuosoFocused,
  };
}

function getScrollBehavior(behavior: 'auto' | 'smooth'): 'auto' | 'smooth' {
  return behavior === 'auto' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';
}
