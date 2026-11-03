// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type KeyboardEvent, useRef, useState } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';

export function useLicenseNavigation<Row extends { id: string }>(
  rows: Array<Row>,
) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<VirtuosoHandle>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);
  const index = Math.max(0, Math.min(activeIndex, rows.length - 1));
  const current = rows[index];
  const activate = (id: string) => {
    const next = rows.findIndex((row) => row.id === id);
    if (next >= 0) {
      setActiveIndex(next);
    }
  };
  const move = (next: number) => {
    if (!rows.length) {
      return;
    }
    const bounded = Math.max(0, Math.min(next, rows.length - 1));
    setActiveIndex(bounded);
    listRef.current?.scrollIntoView({ index: bounded });
  };
  const reset = () => setActiveIndex(0);
  const handleKeyDown = (event: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (event.key === 'ArrowDown') {
        move(index + 1);
      } else if (event.key === 'ArrowUp') {
        move(index - 1);
      } else if (event.key === 'Home') {
        move(0);
      } else if (event.key === 'End') {
        move(rows.length - 1);
      }
    }
  };
  return {
    current,
    index,
    move,
    reset,
    activate,
    listRef,
    scrollerRef,
    handleKeyDown,
  };
}
