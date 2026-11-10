// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, IconButton, Typography } from '@mui/material';
import MuiTooltip from '@mui/material/Tooltip';
import { type KeyboardEvent, useCallback, useState } from 'react';

import type {
  QuickfilterScope,
  SavedQuickfilter,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import type { AttributionFilters } from '../../state/variables/use-filters';
import { useQuickfilters } from '../../state/variables/use-quickfilters';
import { Input } from '../Autocomplete/Autocomplete.style';
import { styles } from './quickfilter-panels.style';

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
  const save = useCallback(() => {
    if (!trimmedName) {
      return;
    }
    const savedId = saveQuickfilter(trimmedName, filters);
    onSaved(savedId);
  }, [trimmedName, saveQuickfilter, filters, onSaved]);

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
  onSaved: (id: string) => void;
  onClose: () => void;
  id: string;
  initialFocusRef?: (element: HTMLElement | null) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  // Snapshot at panel open: focus the save row only when the panel was opened
  // with active filters; later appearing rows must not steal focus mid-flow.
  const [focusSaveRowOnOpen] = useState(hasActiveFilters);
  const setFocusTarget = useCallback(
    (element: HTMLDivElement | null) => {
      initialFocusRef?.(element);
    },
    [initialFocusRef],
  );

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

  return (
    <Box
      id={id}
      ref={focusSaveRowOnOpen ? undefined : setFocusTarget}
      tabIndex={-1}
      role="dialog"
      aria-label={text.quickfilters.title}
      sx={styles.panel}
    >
      <Typography sx={styles.title}>{text.quickfilters.title}</Typography>
      {hasActiveFilters && (
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
      {quickfilters.map((quickfilter) => {
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
              <IconButton
                aria-label={text.quickfilters.delete(quickfilter.name)}
                size="small"
                sx={styles.deleteButton}
                tabIndex={-1}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.stopPropagation();
                  }
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(quickfilter.id);
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          </MuiTooltip>
        );
      })}
    </Box>
  );
}
