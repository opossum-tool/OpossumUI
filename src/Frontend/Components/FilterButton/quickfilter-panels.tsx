// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import BookmarkIcon from '@mui/icons-material/Bookmark';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, IconButton, Typography } from '@mui/material';
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

export function SaveQuickfilterPanel({
  filters,
  scope,
  onClose,
  id,
  initialFocusRef,
}: {
  filters: AttributionFilters;
  scope: QuickfilterScope;
  onClose: () => void;
  id: string;
  initialFocusRef?: (element: HTMLElement | null) => void;
}) {
  const { saveQuickfilter } = useQuickfilters(scope);
  const [name, setName] = useState('');
  const trimmedName = name.trim();
  const save = useCallback(() => {
    if (!trimmedName) {
      return;
    }
    saveQuickfilter(trimmedName, filters);
    onClose();
  }, [trimmedName, saveQuickfilter, filters, onClose]);

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
        variant="filled"
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
        <Button size="small" sx={styles.actionButton} onClick={onClose}>
          {text.buttons.cancel}
        </Button>
      </Box>
    </Box>
  );
}

export function QuickfilterListPanel({
  quickfilters,
  onApply,
  onDelete,
  onClose,
  id,
  initialFocusRef,
}: {
  quickfilters: Array<SavedQuickfilter>;
  onApply: (quickfilter: SavedQuickfilter) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  id: string;
  initialFocusRef?: (element: HTMLElement | null) => void;
}) {
  const setFocusTarget = useCallback(
    (element: HTMLDivElement | null) => {
      initialFocusRef?.(element);
    },
    [initialFocusRef],
  );

  return (
    <Box
      id={id}
      ref={setFocusTarget}
      tabIndex={-1}
      role="dialog"
      aria-label={text.quickfilters.title}
      sx={styles.panel}
    >
      <Typography sx={styles.title}>{text.quickfilters.title}</Typography>
      {quickfilters.length ? (
        <Box sx={styles.list}>
          {quickfilters.map((quickfilter) => (
            <Box
              key={quickfilter.id}
              role="button"
              tabIndex={0}
              aria-label={text.quickfilters.apply(quickfilter.name)}
              sx={styles.row}
              onClick={() => {
                onApply(quickfilter);
                onClose();
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  event.stopPropagation();
                  onClose();
                } else {
                  handleActivationKeyDown(event, () => {
                    onApply(quickfilter);
                    onClose();
                  });
                }
              }}
            >
              <BookmarkIcon fontSize="small" sx={styles.icon} />
              <Box component="span" sx={styles.label}>
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
          ))}
        </Box>
      ) : (
        <Typography sx={styles.empty}>{text.quickfilters.empty}</Typography>
      )}
    </Box>
  );
}
