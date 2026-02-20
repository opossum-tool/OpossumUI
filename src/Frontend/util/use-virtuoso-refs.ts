// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { defer } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VirtuosoHandle } from 'react-virtuoso';

export function useVirtuosoRefs<
  ItemType extends { id: unknown },
  T extends VirtuosoHandle,
>({
  data,
  selectedId,
}: {
  data: ReadonlyArray<ItemType> | null | undefined;
  selectedId: ItemType['id'] | undefined;
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
    if (!data) {
      return undefined;
    }

    return data.findIndex((datum) => datum.id === focusedId);
  }, [data, focusedId]);

  useEffect(() => {
    if (isVirtuosoFocused) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFocusedId(selectedId);
    }

    return () => {
      setFocusedId(undefined);
    };
  }, [isVirtuosoFocused, selectedId]);

  useEffect(() => {
    if (selectedIndex !== undefined && selectedIndex >= 0) {
      defer(() =>
        ref.current?.scrollIntoView({
          index: selectedIndex,
          align: 'center',
        }),
      );
    }
  }, [selectedIndex, ref]);

  const handleKeyDown = useCallback(
    (event: Event) => {
      if (
        data?.length !== undefined &&
        focusedIndex !== undefined &&
        event instanceof KeyboardEvent
      ) {
        let nextIndex: number | null = null;

        if (event.code === 'ArrowUp') {
          nextIndex = Math.max(0, focusedIndex - 1);
        } else if (event.code === 'ArrowDown') {
          nextIndex = Math.min(data.length - 1, focusedIndex + 1);
        }

        if (nextIndex !== null) {
          const index = nextIndex;
          ref.current?.scrollIntoView({
            index,
            behavior: 'auto',
          });
          setFocusedId(data[index].id);
          event.preventDefault();
        }
      }
    },
    [data, focusedIndex],
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
