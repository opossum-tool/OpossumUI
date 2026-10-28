// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type KeyboardEvent, useRef, useState } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';

import type { LicenseOption } from '../../../shared/shared-types';

export function useLicenseNavigation(rows: Array<LicenseOption>) {
  const [navigation, setNavigation] = useState<{
    activeId?: string;
    fallbackIndex: number;
  }>({ fallbackIndex: 0 });
  const listRef = useRef<VirtuosoHandle>(null);
  const scrollerRef = useRef<HTMLElement | null>(null);
  // Preserve active identity when possible; otherwise use the nearest remaining position.
  const activeIndex = rows.findIndex(
    (option) => option.id === navigation.activeId,
  );
  const index =
    activeIndex >= 0
      ? activeIndex
      : Math.max(0, Math.min(navigation.fallbackIndex, rows.length - 1));
  const current = rows[index];
  if (
    navigation.activeId !== current?.id ||
    navigation.fallbackIndex !== index
  ) {
    setNavigation({ activeId: current?.id, fallbackIndex: index });
  }
  const activate = (id: string) => {
    const next = rows.findIndex((row) => row.id === id);
    if (next >= 0) {
      setNavigation({ activeId: id, fallbackIndex: next });
    }
  };
  const move = (next: number) => {
    if (!rows.length) {
      return;
    }
    const bounded = Math.max(0, Math.min(next, rows.length - 1));
    activate(rows[bounded].id);
    listRef.current?.scrollIntoView({ index: bounded });
  };
  const reset = () => setNavigation({ fallbackIndex: 0 });
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
