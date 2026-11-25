// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type KeyboardEvent,
  type PointerEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react';

import type { SavedQuickfilter } from '../../../shared/shared-types';

// Safety net for the frozen drop state in case the settings round-trip
// (which carries the reordered list) never completes.
const DRAG_COMMIT_TIMEOUT_MS = 1000;
type DragState = {
  id: string;
  pointerDeltaY: number;
  fromIndex: number;
  targetIndex: number;
  rowHeight: number;
  rowPitch: number;
  dropped: boolean;
};

type ActiveDrag = {
  id: string;
  pointerId: number;
  startPointerY: number;
  fromIndex: number;
  targetIndex: number;
  rowHeight: number;
  rowPitch: number;
};

/**
 * Owns the pointer-driven reorder of the quickfilters panel. During a drag
 * the row order stays untouched; after the drop the transforms stay frozen
 * until the reordered list has actually rendered, so rows never flash back
 * to their old positions.
 */
export function useQuickfilterReorder<T extends SavedQuickfilter>({
  quickfilters,
  onReorder,
}: {
  quickfilters: Array<T>;
  onReorder: (id: string, targetIndex: number) => void;
}): {
  rowElementsRef: RefObject<Map<string, HTMLDivElement>>;
  effectiveDrag: DragState | null;
  getRowShiftY: (index: number) => number;
  startDrag: (event: PointerEvent, quickfilter: T) => void;
  handleDragPointerMove: (event: PointerEvent) => void;
  endDrag: (event: PointerEvent) => void;
  handleReorderKeyDown: (event: KeyboardEvent, quickfilter: T) => void;
} {
  const rowElementsRef = useRef(new Map<string, HTMLDivElement>());
  const [drag, setDrag] = useState<DragState | null>(null);
  const activeDragRef = useRef<ActiveDrag | null>(null);

  const effectiveDrag = (() => {
    if (!drag) {
      return null;
    }
    if (drag.dropped) {
      const index = quickfilters.findIndex(({ id }) => id === drag.id);
      if (index === -1 || index === drag.targetIndex) {
        return null;
      }
    }
    return drag;
  })();

  useEffect(() => {
    if (!drag?.dropped) {
      return;
    }
    const index = quickfilters.findIndex(({ id }) => id === drag.id);
    if (index === -1 || index === drag.targetIndex) {
      setDrag(null);
    }
  }, [drag, quickfilters]);

  // Never stay frozen if the reorder does not arrive.
  useEffect(() => {
    if (!drag?.dropped) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setDrag((current) => (current?.dropped ? null : current));
    }, DRAG_COMMIT_TIMEOUT_MS);
    return () => {
      window.clearTimeout(timeout);
    };
  }, [drag]);

  // Rows between the dragged row and its target slot glide aside by exactly
  // one slot pitch.
  const getRowShiftY = (index: number): number => {
    if (!effectiveDrag) {
      return 0;
    }
    const { fromIndex, targetIndex, rowPitch } = effectiveDrag;
    if (fromIndex < targetIndex && index > fromIndex && index <= targetIndex) {
      return -rowPitch;
    } else if (
      fromIndex > targetIndex &&
      index >= targetIndex &&
      index < fromIndex
    ) {
      return rowPitch;
    }
    return 0;
  };

  const startDrag = (event: PointerEvent, quickfilter: T): void => {
    const fromIndex = quickfilters.findIndex(({ id }) => id === quickfilter.id);
    const rect = rowElementsRef.current
      .get(quickfilter.id)
      ?.getBoundingClientRect();
    if (fromIndex === -1 || !rect) {
      return;
    }
    // Measured before any transforms exist.
    const [firstRow, secondRow] = quickfilters;
    const firstRect = firstRow
      ? rowElementsRef.current.get(firstRow.id)?.getBoundingClientRect()
      : undefined;
    const secondRect = secondRow
      ? rowElementsRef.current.get(secondRow.id)?.getBoundingClientRect()
      : undefined;
    const rowPitch =
      firstRect && secondRect ? secondRect.top - firstRect.top : rect.height;
    event.currentTarget.setPointerCapture(event.pointerId);
    activeDragRef.current = {
      id: quickfilter.id,
      pointerId: event.pointerId,
      startPointerY: event.clientY,
      fromIndex,
      targetIndex: fromIndex,
      rowHeight: rect.height,
      rowPitch,
    };
    setDrag({
      id: quickfilter.id,
      pointerDeltaY: 0,
      fromIndex,
      targetIndex: fromIndex,
      rowHeight: rect.height,
      rowPitch,
      dropped: false,
    });
  };

  const handleDragPointerMove = (event: PointerEvent): void => {
    const activeDrag = activeDragRef.current;
    if (activeDrag?.pointerId !== event.pointerId) {
      return;
    }
    // The target slot is the number of row midpoints the pointer passed.
    let targetIndex = 0;
    quickfilters.forEach((quickfilter) => {
      if (quickfilter.id === activeDrag.id) {
        return;
      }
      const rect = rowElementsRef.current
        .get(quickfilter.id)
        ?.getBoundingClientRect();
      if (rect && event.clientY > rect.top + rect.height / 2) {
        targetIndex += 1;
      }
    });
    activeDragRef.current = { ...activeDrag, targetIndex };
    setDrag({
      id: activeDrag.id,
      pointerDeltaY: event.clientY - activeDrag.startPointerY,
      fromIndex: activeDrag.fromIndex,
      targetIndex,
      rowHeight: activeDrag.rowHeight,
      rowPitch: activeDrag.rowPitch,
      dropped: false,
    });
  };

  const endDrag = (event: PointerEvent): void => {
    const activeDrag = activeDragRef.current;
    if (activeDrag?.pointerId !== event.pointerId) {
      return;
    }
    activeDragRef.current = null;
    // Freeze every row at the position it will occupy after the reorder.
    const dropDelta =
      (activeDrag.targetIndex - activeDrag.fromIndex) * activeDrag.rowPitch;
    setDrag({
      id: activeDrag.id,
      pointerDeltaY: dropDelta,
      fromIndex: activeDrag.fromIndex,
      targetIndex: activeDrag.targetIndex,
      rowHeight: activeDrag.rowHeight,
      rowPitch: activeDrag.rowPitch,
      dropped: true,
    });
    if (activeDrag.targetIndex !== activeDrag.fromIndex) {
      onReorder(activeDrag.id, activeDrag.targetIndex);
    }
  };

  const handleReorderKeyDown = (event: KeyboardEvent, quickfilter: T): void => {
    const index = quickfilters.findIndex(({ id }) => id === quickfilter.id);
    if (event.key === 'ArrowUp' && index > 0) {
      event.preventDefault();
      onReorder(quickfilter.id, index - 1);
    } else if (event.key === 'ArrowDown' && index < quickfilters.length - 1) {
      event.preventDefault();
      onReorder(quickfilter.id, index + 1);
    }
  };

  return {
    rowElementsRef,
    effectiveDrag,
    getRowShiftY,
    startDrag,
    handleDragPointerMove,
    endDrag,
    handleReorderKeyDown,
  };
}
