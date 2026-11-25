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
import EditOffIcon from '@mui/icons-material/EditOff';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Button, IconButton, Typography } from '@mui/material';
import MuiTooltip from '@mui/material/Tooltip';
import { type KeyboardEvent, useCallback, useRef, useState } from 'react';

import type { SavedQuickfilter } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { quickfiltersConflict } from '../../state/variables/use-quickfilters';
import { Input } from '../Autocomplete/Autocomplete.style';
import { styles } from './quickfilter-panels.style';
import { useQuickfilterReorder } from './use-quickfilter-reorder';

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
  onSave,
  onCancel,
  onClose,
  id,
  initialFocusRef,
}: {
  /** Called with the non-empty, trimmed name. */
  onSave: (name: string) => void;
  onCancel?: () => void;
  onClose: () => void;
  id: string;
  initialFocusRef?: (element: HTMLElement | null) => void;
}) {
  const [name, setName] = useState('');
  const trimmedName = name.trim();
  const cancel = onCancel ?? onClose;
  const save = (): void => {
    if (!trimmedName) {
      return;
    }
    onSave(trimmedName);
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

export function QuickfiltersPanel<T extends SavedQuickfilter>({
  quickfilters,
  incompatibleProjectIds = [],
  conflictingIds = [],
  activeQuickfilterIds,
  hasActiveFilters,
  onSave,
  onApply,
  onDelete,
  onRename,
  onReorder,
  onClearAll,
  onClose,
  id,
  initialFocusRef,
}: {
  quickfilters: Array<T>;
  incompatibleProjectIds?: Array<string>;
  conflictingIds?: Array<string>;
  activeQuickfilterIds: Array<string>;
  hasActiveFilters: boolean;
  /** Called with the non-empty, trimmed name. */
  onSave: (name: string) => void;
  onApply: (quickfilter: T) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onReorder: (id: string, targetIndex: number) => void;
  onClearAll: () => void;
  onClose: () => void;
  id: string;
  initialFocusRef?: (element: HTMLElement | null) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // Mirrors the renaming state in a ref so blur/Escape handlers can never
  // commit a rename that was just cancelled.
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');
  const renamingIdRef = useRef<string | null>(null);
  const {
    rowElementsRef,
    effectiveDrag,
    getRowShiftY,
    startDrag,
    handleDragPointerMove,
    endDrag,
    handleReorderKeyDown,
  } = useQuickfilterReorder({ quickfilters, onReorder });
  const showSaveRow = hasActiveFilters;
  // Snapshot: only the panel opened with active filters focuses the save row.
  const [focusSaveRowOnOpen] = useState(showSaveRow);
  const setFocusTarget = useCallback(
    (element: HTMLDivElement | null) => {
      initialFocusRef?.(element);
    },
    [initialFocusRef],
  );

  if (isSaving) {
    return (
      <SaveQuickfilterPanel
        onSave={(name) => {
          onSave(name);
          // Return to the list; the panel closes only on dismiss.
          setIsSaving(false);
        }}
        onCancel={() => setIsSaving(false)}
        onClose={onClose}
        id={id}
        initialFocusRef={initialFocusRef}
      />
    );
  }

  const startRename = (quickfilter: SavedQuickfilter): void => {
    renamingIdRef.current = quickfilter.id;
    setRenamingId(quickfilter.id);
    setRenamingName(quickfilter.name);
  };

  const endRename = (): void => {
    renamingIdRef.current = null;
    setRenamingId(null);
  };

  const commitRename = (): void => {
    const id = renamingIdRef.current;
    if (id === null) {
      return;
    }
    const trimmedName = renamingName.trim();
    const original = quickfilters.find((quickfilter) => quickfilter.id === id);
    if (original && trimmedName && trimmedName !== original.name) {
      onRename(id, trimmedName);
    }
    endRename();
  };

  const cancelRename = (): void => {
    endRename();
  };

  const titleRow = (
    <Box sx={styles.titleRow}>
      <Typography sx={styles.title}>{text.quickfilters.title}</Typography>
      <Box sx={styles.titleActions}>
        <Button
          size="small"
          aria-label={text.quickfilters.clearAllLabel}
          sx={styles.clearButton}
          disabled={!activeQuickfilterIds.length}
          onClick={onClearAll}
        >
          {text.quickfilters.clearAll}
        </Button>
        <MuiTooltip
          title={
            isEditing ? text.quickfilters.finishEditing : text.quickfilters.edit
          }
          disableInteractive
          placement={'bottom'}
        >
          <IconButton
            size={'small'}
            aria-label={
              isEditing
                ? text.quickfilters.finishEditing
                : text.quickfilters.edit
            }
            onClick={() => setIsEditing((editing) => !editing)}
            sx={styles.titleButton}
          >
            {isEditing ? (
              <EditOffIcon fontSize={'small'} />
            ) : (
              <EditIcon fontSize={'small'} />
            )}
          </IconButton>
        </MuiTooltip>
      </Box>
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
      <Box sx={styles.list}>
        {!quickfilters.length && !isSaving && !isEditing && (
          <Typography sx={styles.emptyHint}>
            {text.quickfilters.empty}
          </Typography>
        )}
        {isEditing
          ? quickfilters.map((quickfilter, index) => {
              const isDragged = effectiveDrag?.id === quickfilter.id;
              const shiftY = getRowShiftY(index);
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
                    // The dragged row tracks the pointer exactly; only the
                    // other rows animate.
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
                  {renamingId === quickfilter.id ? (
                    <Input
                      autoFocus
                      size="small"
                      variant="outlined"
                      numberOfEndAdornments={0}
                      value={renamingName}
                      onChange={(event) => setRenamingName(event.target.value)}
                      slotProps={{
                        htmlInput: {
                          'aria-label': text.quickfilters.nameLabel,
                        },
                      }}
                      sx={styles.renameInput}
                      onBlur={commitRename}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Enter' &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault();
                          event.stopPropagation();
                          commitRename();
                        } else if (event.key === 'Escape') {
                          event.preventDefault();
                          event.stopPropagation();
                          cancelRename();
                        }
                      }}
                    />
                  ) : (
                    <>
                      <Box
                        component="span"
                        role="button"
                        tabIndex={0}
                        aria-label={text.quickfilters.reorder(quickfilter.name)}
                        sx={[
                          styles.dragHandle,
                          isDragged && styles.dragHandleActive,
                        ]}
                        onPointerDown={(event) => startDrag(event, quickfilter)}
                        onPointerMove={handleDragPointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onKeyDown={(event) =>
                          handleReorderKeyDown(event, quickfilter)
                        }
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
                        aria-label={text.quickfilters.rename(quickfilter.name)}
                        onClick={() => startRename(quickfilter)}
                        sx={styles.editButton}
                      >
                        <EditIcon fontSize={'small'} />
                      </IconButton>
                      <IconButton
                        size={'small'}
                        aria-label={text.quickfilters.delete(quickfilter.name)}
                        onClick={() => onDelete(quickfilter.id)}
                        sx={styles.editButton}
                      >
                        <DeleteIcon fontSize={'small'} />
                      </IconButton>
                    </>
                  )}
                </Box>
              );
            })
          : quickfilters.map((quickfilter) => {
              const active = activeQuickfilterIds.includes(quickfilter.id);
              // Inapplicable quickfilters cannot be applied at all;
              // conflicting ones apply and overwrite the clashing scalars,
              // warned about in the tooltip.
              const inapplicableReason = incompatibleProjectIds.includes(
                quickfilter.id,
              )
                ? text.quickfilters.incompatibleWithProject
                : undefined;
              const conflicting =
                !active && conflictingIds.includes(quickfilter.id);
              const conflictWarning = ((): string | undefined => {
                if (!conflicting) {
                  return undefined;
                }
                const names = quickfilters
                  .filter(
                    (other) =>
                      activeQuickfilterIds.includes(other.id) &&
                      quickfiltersConflict(other, quickfilter),
                  )
                  .map(({ name }) => `'${name}'`)
                  .join(' and ');
                return names
                  ? text.quickfilters.replacesQuickfilters(names)
                  : text.quickfilters.replacesConflictingFilters;
              })();
              const apply = (): void => {
                if (!inapplicableReason) {
                  onApply(quickfilter);
                }
              };
              return (
                <MuiTooltip
                  key={quickfilter.id}
                  title={inapplicableReason ?? conflictWarning ?? ''}
                >
                  <Box
                    role="button"
                    tabIndex={0}
                    aria-label={text.quickfilters.apply(quickfilter.name)}
                    aria-pressed={active}
                    aria-disabled={inapplicableReason !== undefined}
                    sx={[
                      styles.row,
                      active && styles.selectedRow,
                      inapplicableReason !== undefined &&
                        styles.inapplicableRow,
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
                    {conflicting ? (
                      <WarningAmberIcon
                        fontSize="small"
                        sx={styles.conflictIcon}
                      />
                    ) : (
                      <CheckIcon
                        fontSize="small"
                        sx={[styles.checkIcon, !active && styles.hiddenIcon]}
                      />
                    )}
                  </Box>
                </MuiTooltip>
              );
            })}
      </Box>
    </Box>
  );
}
