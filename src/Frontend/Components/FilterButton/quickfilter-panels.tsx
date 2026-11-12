// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Button, IconButton, Typography } from '@mui/material';
import MuiTooltip from '@mui/material/Tooltip';
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import type {
  QuickfilterScope,
  SavedQuickfilter,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import type { AttributionFilters } from '../../state/variables/use-filters';
import { useQuickfilters } from '../../state/variables/use-quickfilters';
import { Input } from '../Autocomplete/Autocomplete.style';
import { styles } from './quickfilter-panels.style';

// Safety net for the frozen drop state in case the settings round-trip
// (which carries the reordered list) never completes.
const DRAG_COMMIT_TIMEOUT_MS = 1000;

function handleActivationKeyDown(
  event: KeyboardEvent,
  onActivate: () => void,
): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onActivate();
  }
}

function SaveQuickfilterPanel({
  filters,
  scope,
  onSaved,
  onCancel,
  onClose,
  id,
  initialFocusRef,
}: {
  filters: AttributionFilters;
  scope: QuickfilterScope;
  onSaved: (id: string) => void;
  onCancel?: () => void;
  onClose: () => void;
  id: string;
  initialFocusRef?: (element: HTMLElement | null) => void;
}) {
  const { saveQuickfilter } = useQuickfilters(scope);
  const [name, setName] = useState('');
  const trimmedName = name.trim();
  const cancel = onCancel ?? onClose;
  const save = (): void => {
    if (!trimmedName) {
      return;
    }
    const savedId = saveQuickfilter(trimmedName, filters);
    onSaved(savedId);
  };

  return (
    <Box
      id={id}
      role="dialog"
      aria-label={text.quickfilters.save}
      sx={styles.panel}
    >
      <Input
        inputRef={initialFocusRef}
        label={text.quickfilters.nameLabel}
        variant="outlined"
        size="small"
        numberOfEndAdornments={0}
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault();
            event.stopPropagation();
            save();
          }
        }}
      />
      <Box sx={styles.actions}>
        <Button
          size="small"
          sx={styles.actionButton}
          disabled={!trimmedName}
          onClick={save}
        >
          {text.quickfilters.saveAction}
        </Button>
        <Button size="small" sx={styles.actionButton} onClick={cancel}>
          {text.buttons.cancel}
        </Button>
      </Box>
    </Box>
  );
}

export function QuickfiltersPanel({
  quickfilters,
  incompatibleProjectIds = [],
  conflictingIds = [],
  activeQuickfilterIds,
  hasActiveFilters,
  filters,
  scope,
  onApply,
  onDelete,
  onReorder,
  onSaved,
  onClose,
  id,
  initialFocusRef,
}: {
  quickfilters: Array<SavedQuickfilter>;
  incompatibleProjectIds?: Array<string>;
  conflictingIds?: Array<string>;
  activeQuickfilterIds: Array<string>;
  hasActiveFilters: boolean;
  filters: AttributionFilters;
  scope: QuickfilterScope;
  onApply: (quickfilter: SavedQuickfilter) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, targetIndex: number) => void;
  onSaved: (id: string) => void;
  onClose: () => void;
  id: string;
  initialFocusRef?: (element: HTMLElement | null) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const rowElementsRef = useRef(new Map<string, HTMLDivElement>());
  // During a drag the row order stays untouched; the dragged row follows the
  // pointer visually and the reorder is committed on drop. After the drop,
  // the transforms stay in their final configuration until the reordered
  // list has actually rendered (the optimistic settings update supplies the
  // new order), so the rows never flash back to their old positions.
  const [drag, setDrag] = useState<{
    id: string;
    pointerDeltaY: number;
    fromIndex: number;
    targetIndex: number;
    rowHeight: number;
    rowPitch: number;
    dropped: boolean;
  } | null>(null);
  const activeDragRef = useRef<{
    id: string;
    pointerId: number;
    startPointerY: number;
    fromIndex: number;
    targetIndex: number;
    rowHeight: number;
    rowPitch: number;
  } | null>(null);
  const showSaveRow = hasActiveFilters && !activeQuickfilterIds.length;
  // Snapshot at panel open: focus the save row only when the panel was opened
  // with manual filters; later appearing rows must not steal focus mid-flow.
  const [focusSaveRowOnOpen] = useState(showSaveRow);
  const setFocusTarget = useCallback(
    (element: HTMLDivElement | null) => {
      initialFocusRef?.(element);
    },
    [initialFocusRef],
  );

  // After a drop the transforms stay frozen until the reordered list renders.
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

  // Clears the frozen drop state as soon as the reordered list has rendered.
  useEffect(() => {
    if (!drag?.dropped) {
      return;
    }
    const index = quickfilters.findIndex(({ id }) => id === drag.id);
    if (index === -1 || index === drag.targetIndex) {
      setDrag(null);
    }
  }, [drag, quickfilters]);

  // Safety net: never stay frozen if the reorder does not arrive.
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

  if (isSaving) {
    return (
      <SaveQuickfilterPanel
        filters={filters}
        scope={scope}
        onSaved={(savedId) => {
          onSaved(savedId);
          // Return to the list so the newly saved quickfilter is visible and
          // immediately active; the panel closes only on dismiss.
          setIsSaving(false);
        }}
        onCancel={() => setIsSaving(false)}
        onClose={onClose}
        id={id}
        initialFocusRef={initialFocusRef}
      />
    );
  }

  const startDrag = (
    event: React.PointerEvent,
    quickfilter: SavedQuickfilter,
  ): void => {
    const fromIndex = quickfilters.findIndex(({ id }) => id === quickfilter.id);
    const rect = rowElementsRef.current
      .get(quickfilter.id)
      ?.getBoundingClientRect();
    if (fromIndex === -1 || !rect) {
      return;
    }
    // Distance between neighbouring row tops, measured before any transforms
    // exist.
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

  const handleDragPointerMove = (event: React.PointerEvent): void => {
    const activeDrag = activeDragRef.current;
    if (activeDrag?.pointerId !== event.pointerId) {
      return;
    }
    // The target slot is the number of neighbouring row midpoints the
    // pointer has passed.
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

  const endDrag = (event: React.PointerEvent): void => {
    const activeDrag = activeDragRef.current;
    if (activeDrag?.pointerId !== event.pointerId) {
      return;
    }
    activeDragRef.current = null;
    // Freeze every row at the exact position it will occupy after the
    // reorder: the dragged row jumps to its target slot and the others to
    // theirs.
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

  const titleRow = (
    <Box sx={styles.titleRow}>
      <Typography sx={styles.title}>{text.quickfilters.title}</Typography>
      <IconButton
        size={'small'}
        aria-label={
          isEditing ? text.quickfilters.finishEditing : text.quickfilters.edit
        }
        onClick={() => setIsEditing((editing) => !editing)}
        sx={styles.titleButton}
      >
        <EditIcon fontSize={'small'} />
      </IconButton>
    </Box>
  );

  return (
    <Box
      id={id}
      ref={focusSaveRowOnOpen && !isEditing ? undefined : setFocusTarget}
      tabIndex={-1}
      role="dialog"
      aria-label={text.quickfilters.title}
      sx={styles.panel}
    >
      {titleRow}
      {!isEditing && showSaveRow && (
        <Box
          role="button"
          tabIndex={0}
          ref={focusSaveRowOnOpen ? setFocusTarget : undefined}
          aria-label={text.quickfilters.save}
          sx={styles.row}
          onClick={() => setIsSaving(true)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') {
              event.preventDefault();
              event.stopPropagation();
              onClose();
            } else {
              handleActivationKeyDown(event, () => setIsSaving(true));
            }
          }}
        >
          <BookmarkAddIcon fontSize="small" sx={styles.icon} />
          <Box component="span" sx={styles.label}>
            {text.quickfilters.save}
          </Box>
        </Box>
      )}
      {isEditing
        ? quickfilters.map((quickfilter, index) => {
            const isDragged = effectiveDrag?.id === quickfilter.id;
            // Rows between the dragged row and its target slot glide aside
            // to make room for it, by exactly one slot pitch so that they
            // already rest on the positions they will occupy after the drop.
            let shiftY = 0;
            if (effectiveDrag && !isDragged) {
              const { fromIndex, targetIndex, rowPitch } = effectiveDrag;
              if (
                fromIndex < targetIndex &&
                index > fromIndex &&
                index <= targetIndex
              ) {
                shiftY = -rowPitch;
              } else if (
                fromIndex > targetIndex &&
                index >= targetIndex &&
                index < fromIndex
              ) {
                shiftY = rowPitch;
              }
            }
            return (
              <Box
                key={quickfilter.id}
                ref={(element: HTMLDivElement | null) => {
                  if (element) {
                    rowElementsRef.current.set(quickfilter.id, element);
                  } else {
                    rowElementsRef.current.delete(quickfilter.id);
                  }
                }}
                sx={[
                  styles.editRow,
                  // Only rows gliding aside animate; the dragged row itself
                  // must track the pointer exactly, and drops commit without
                  // any transition so nothing flickers.
                  effectiveDrag && !isDragged ? styles.smoothRow : false,
                  shiftY !== 0 && styles.shiftedRow,
                  isDragged && styles.draggingRow,
                ]}
                style={{
                  transform: `translateY(${
                    isDragged ? (effectiveDrag?.pointerDeltaY ?? 0) : shiftY
                  }px)`,
                }}
              >
                <Box
                  component="span"
                  role="button"
                  tabIndex={0}
                  aria-label={text.quickfilters.reorder(quickfilter.name)}
                  sx={[styles.dragHandle, isDragged && styles.dragHandleActive]}
                  onPointerDown={(event) => startDrag(event, quickfilter)}
                  onPointerMove={handleDragPointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  onKeyDown={(event) => {
                    const index = quickfilters.findIndex(
                      ({ id }) => id === quickfilter.id,
                    );
                    if (event.key === 'ArrowUp' && index > 0) {
                      event.preventDefault();
                      onReorder(quickfilter.id, index - 1);
                    } else if (
                      event.key === 'ArrowDown' &&
                      index < quickfilters.length - 1
                    ) {
                      event.preventDefault();
                      onReorder(quickfilter.id, index + 1);
                    }
                  }}
                >
                  <DragIndicatorIcon
                    fontSize={'small'}
                    sx={styles.dragHandleIcon}
                  />
                </Box>
                <Box component="span" sx={styles.label}>
                  {quickfilter.name}
                </Box>
                <IconButton
                  size={'small'}
                  aria-label={text.quickfilters.delete(quickfilter.name)}
                  onClick={() => onDelete(quickfilter.id)}
                  sx={styles.editButton}
                >
                  <DeleteIcon fontSize={'small'} />
                </IconButton>
              </Box>
            );
          })
        : quickfilters.map((quickfilter) => {
            const active = activeQuickfilterIds.includes(quickfilter.id);
            // Active quickfilters can always be removed; conflicts with the
            // current filters only prevent applying them. Quickfilters that the
            // project or settings cannot express stay disabled like before.
            const disabledReason = (() => {
              if (incompatibleProjectIds.includes(quickfilter.id)) {
                return text.quickfilters.incompatibleWithProject;
              }
              if (!active && conflictingIds.includes(quickfilter.id)) {
                return text.quickfilters.conflictsWithFilters;
              }
              return undefined;
            })();
            const apply = (): void => {
              if (disabledReason === undefined) {
                onApply(quickfilter);
              }
            };
            return (
              <MuiTooltip key={quickfilter.id} title={disabledReason ?? ''}>
                <Box
                  role="button"
                  tabIndex={0}
                  aria-label={text.quickfilters.apply(quickfilter.name)}
                  aria-pressed={active}
                  aria-disabled={disabledReason !== undefined}
                  sx={[
                    styles.row,
                    active && styles.selectedRow,
                    disabledReason !== undefined && styles.inapplicableRow,
                  ]}
                  onClick={apply}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowLeft') {
                      event.preventDefault();
                      event.stopPropagation();
                      onClose();
                    } else {
                      handleActivationKeyDown(event, apply);
                    }
                  }}
                >
                  {active ? (
                    <BookmarkIcon fontSize="small" sx={styles.icon} />
                  ) : (
                    <BookmarkBorderIcon fontSize="small" sx={styles.icon} />
                  )}
                  <Box
                    component="span"
                    sx={[styles.label, active && styles.activeLabel]}
                  >
                    {quickfilter.name}
                  </Box>
                  <CheckIcon
                    fontSize="small"
                    sx={[styles.checkIcon, !active && styles.hiddenIcon]}
                  />
                </Box>
              </MuiTooltip>
            );
          })}
    </Box>
  );
}
