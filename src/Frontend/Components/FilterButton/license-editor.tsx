// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ClearIcon from '@mui/icons-material/Clear';
import CopyrightIcon from '@mui/icons-material/Copyright';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Virtuoso } from 'react-virtuoso';

import type { LicenseOption } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { normalizeLicenseSearch } from '../../../shared/text-search';
import { baseIcon, OpossumColors } from '../../shared-styles';
import {
  EndAdornmentContainer,
  Input,
} from '../Autocomplete/Autocomplete.style';
import { StyledCheckIcon } from '../SelectMenu/SelectMenu.style';
import type { FilterOption } from './FilterButton';
import { styles } from './license-editor.style';
import {
  buildLicenseEditorRows,
  type LicenseEditorRow,
  type LicenseSelection,
  type LicenseView,
} from './license-editor.util';
import { useLicenseNavigation } from './use-license-navigation';

export type { LicenseSelection } from './license-editor.util';

export interface LicenseConfiguration {
  licenses: Array<LicenseOption>;
  licensesLoading?: boolean;
  selection: LicenseSelection;
  onSelectionChange: (selection: LicenseSelection) => void;
}

function LicenseEditor({
  licenses,
  licensesLoading,
  selection,
  onSelectionChange,
  onBack,
  id: dialogId,
  initialFocusRef,
}: LicenseConfiguration & {
  onBack: () => void;
  id: string;
  initialFocusRef?: (element: HTMLElement | null) => void;
}) {
  const { licenses: selectedLicenses, licenseSearches } = selection;
  const selectionCount = selectedLicenses.length + licenseSearches.length;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setInputRef = useCallback(
    (element: HTMLInputElement | null) => {
      inputRef.current = element;
      initialFocusRef?.(element);
    },
    [initialFocusRef],
  );
  const [search, setSearch] = useState('');
  const [view, setView] = useState<LicenseView>('all');
  const [listHeight, setListHeight] = useState(1);
  const listId = useId();
  const selectedIds = useMemo(
    () => new Set(selectedLicenses.map((option) => option.id)),
    [selectedLicenses],
  );
  const { rows, trimmedSearch, duplicate } = useMemo(
    () => buildLicenseEditorRows({ licenses, selection, search, view }),
    [licenses, selection, search, view],
  );
  const {
    current,
    index,
    move,
    reset,
    activate,
    listRef,
    scrollerRef,
    handleKeyDown,
  } = useLicenseNavigation(rows);
  const [mounted, setMounted] = useState({ startIndex: 0, endIndex: -1 });
  const [listHasFocus, setListHasFocus] = useState(false);
  const resetList = () => {
    reset();
    setListHasFocus(false);
    setMounted({ startIndex: 0, endIndex: -1 });
  };
  const updateSearch = (value: string) => {
    setSearch(value);
    resetList();
  };
  const addCondition = () => {
    if (!normalizeLicenseSearch(trimmedSearch) || duplicate) {
      return;
    }
    onSelectionChange({
      ...selection,
      licenseSearches: [...licenseSearches, trimmedSearch],
    });
    updateSearch('');
    inputRef.current?.focus();
  };
  const activateRow = (row: LicenseEditorRow) => {
    activate(row.id);
    if (row.kind === 'suggestion') {
      addCondition();
      return;
    }
    if (row.kind === 'search') {
      onSelectionChange({
        ...selection,
        licenseSearches: licenseSearches.filter((value) => value !== row.label),
      });
      return;
    }
    onSelectionChange({
      ...selection,
      licenses: selectedIds.has(row.option.id)
        ? selectedLicenses.filter((value) => value.id !== row.option.id)
        : [...selectedLicenses, row.option],
    });
  };
  const handleListKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      event.stopPropagation();
      onBack();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (current) {
        activateRow(current);
      }
    } else {
      handleKeyDown(event);
    }
  };
  let emptyMessage: string = text.licenseEditor.noAvailable;
  if (view === 'selected' && !selectionCount) {
    emptyMessage = text.licenseEditor.noSelected;
  } else if (view === 'all' && licensesLoading) {
    emptyMessage = text.licenseEditor.loading;
  } else if (trimmedSearch) {
    emptyMessage = text.licenseEditor.noMatches;
  }
  const optionId = (id: string) => `${listId}-${encodeURIComponent(id)}`;
  return (
    <Box
      id={dialogId}
      role="dialog"
      aria-label={text.licenseEditor.title}
      sx={styles.editor}
    >
      <Box sx={styles.header}>
        <Tabs
          aria-label={text.licenseEditor.views}
          sx={styles.tabs}
          value={view}
          onChange={(_, value: LicenseView) => {
            setView(value);
            resetList();
          }}
        >
          <Tab value="all" label={text.licenseEditor.all} />
          <Tab
            value="selected"
            label={text.licenseEditor.selected(selectionCount)}
          />
        </Tabs>
        <Button
          size="small"
          aria-label={text.licenseEditor.clearLicenses}
          sx={styles.clearButton}
          disabled={!selectionCount}
          onClick={() =>
            onSelectionChange({ licenses: [], licenseSearches: [] })
          }
        >
          {text.licenseEditor.clear}
        </Button>
      </Box>
      <Input
        inputRef={setInputRef}
        placeholder={text.licenseEditor.search}
        variant="filled"
        size="small"
        background="transparent"
        numberOfEndAdornments={1}
        value={search}
        onChange={(event) => updateSearch(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' &&
            view === 'all' &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            event.stopPropagation();
            addCondition();
          } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            move(0);
            scrollerRef.current?.focus();
          }
        }}
        sx={{ flexShrink: 0 }}
        slotProps={{
          htmlInput: { 'aria-label': text.licenseEditor.search },
          input: {
            disableUnderline: true,
            startAdornment: <SearchIcon sx={baseIcon} />,
            endAdornment: (
              <EndAdornmentContainer>
                <IconButton
                  aria-label={text.licenseEditor.clearSearch}
                  size="small"
                  sx={{ p: 1 }}
                  disabled={!search}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => updateSearch('')}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </EndAdornmentContainer>
            ),
          },
        }}
      />
      <Box
        ref={scrollerRef}
        sx={{
          height: rows.length ? listHeight : 'auto',
          flexShrink: 1,
          minHeight: 0,
          overflow: 'hidden',
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
        role="listbox"
        aria-label={text.licenseEditor.names}
        aria-multiselectable
        tabIndex={0}
        onFocus={(event) => {
          setListHasFocus(event.target === event.currentTarget);
        }}
        onBlur={() => setListHasFocus(false)}
        aria-activedescendant={
          current && index >= mounted.startIndex && index <= mounted.endIndex
            ? optionId(current.id)
            : undefined
        }
        onKeyDown={handleListKeyDown}
      >
        {rows.length ? (
          <Virtuoso
            // Remounting resets virtualization measurements and scroll position.
            key={`${view}-${search}`}
            ref={listRef}
            style={{ height: listHeight, flexShrink: 1, minHeight: 0 }}
            data={rows}
            computeItemKey={(_, option) => option.id}
            totalListHeightChanged={setListHeight}
            skipAnimationFrameInResizeObserver
            rangeChanged={setMounted}
            tabIndex={-1}
            itemContent={(_, option) => (
              <LicenseRow
                id={optionId(option.id)}
                option={option}
                selected={
                  option.kind === 'search' ||
                  (option.kind === 'exact' && selectedIds.has(option.option.id))
                }
                active={listHasFocus && current?.id === option.id}
                view={view}
                onActivate={() => activateRow(option)}
                onRemove={() => {
                  scrollerRef.current?.focus();
                  activateRow(option);
                }}
              />
            )}
          />
        ) : (
          <Typography sx={{ p: 2 }}>{emptyMessage}</Typography>
        )}
      </Box>
    </Box>
  );
}

function LicenseRow({
  id,
  option,
  selected,
  active,
  view,
  onActivate,
  onRemove,
}: {
  id: string;
  option: LicenseEditorRow;
  selected: boolean;
  active: boolean;
  view: LicenseView;
  onActivate: () => void;
  onRemove: () => void;
}) {
  const { label, kind } = option;
  const suggestion = kind === 'suggestion';
  const disabled = suggestion && option.disabled;
  const isSearch = kind !== 'exact';
  const accessibleLabel = suggestion
    ? text.licenseEditor.addContains(label)
    : kind === 'search'
      ? text.licenseEditor.contains(label)
      : label;
  const row = (
    <Box
      id={id}
      role="option"
      aria-labelledby={isSearch ? undefined : `${id}-label`}
      aria-label={isSearch ? accessibleLabel : undefined}
      aria-disabled={disabled || undefined}
      aria-selected={selected}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onActivate}
      sx={{
        ...styles.row,
        bgcolor: selected ? OpossumColors.lightestBlue : undefined,
        outline: active ? '1px solid currentColor' : undefined,
        color: disabled ? 'text.disabled' : undefined,
        borderBottom: suggestion ? '1px solid' : undefined,
        borderColor: 'divider',
      }}
    >
      {isSearch && <SearchIcon sx={styles.searchIcon} />}
      <Box component="span" id={`${id}-label`} sx={styles.label}>
        {label}
      </Box>
      {!suggestion &&
        (view === 'selected' ? (
          <Tooltip title={text.licenseEditor.remove} disableInteractive>
            <IconButton
              aria-label={text.licenseEditor.removeLicense(accessibleLabel)}
              tabIndex={-1}
              size="small"
              sx={styles.removeButton}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.stopPropagation();
                }
              }}
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <StyledCheckIcon visible={selected} sx={{ flexShrink: 0 }} />
        ))}
    </Box>
  );
  return isSearch ? (
    <Tooltip
      title={disabled ? text.licenseEditor.alreadySelected : accessibleLabel}
      describeChild
      disableInteractive
    >
      {row}
    </Tooltip>
  ) : (
    row
  );
}

export function createLicenseFilterOption(
  configuration: LicenseConfiguration,
): FilterOption {
  const {
    selection: { licenses: selectedLicenses, licenseSearches },
    licenses,
  } = configuration;
  const count = selectedLicenses.length + licenseSearches.length;
  let label: ReactNode;
  if (!count) {
    label = text.licenseEditor.select;
  } else if (count > 1) {
    label = text.licenseEditor.selectionCount(count);
  } else if (selectedLicenses.length) {
    label =
      licenses.find((option) => option.id === selectedLicenses[0].id)?.label ??
      selectedLicenses[0].label;
  } else {
    label = (
      <Tooltip
        title={text.licenseEditor.contains(licenseSearches[0])}
        describeChild
        disableInteractive
      >
        <Box component="span" sx={styles.searchLabel}>
          <SearchIcon sx={styles.captionSearchIcon} />
          <Box component="span" sx={styles.searchQuery}>
            {licenseSearches[0]}
          </Box>
        </Box>
      </Tooltip>
    );
  }
  return {
    id: 'license',
    ariaLabel:
      count === 1 && licenseSearches.length
        ? text.licenseEditor.contains(licenseSearches[0])
        : undefined,
    kind: 'panel',
    selected: !!count,
    label,
    icon: <CopyrightIcon sx={{ ...baseIcon, color: OpossumColors.green }} />,
    endIcon: <ChevronRightIcon />,
    renderPanel: ({ id, onClose, initialFocusRef }) => (
      <LicenseEditor
        {...configuration}
        id={id}
        onBack={onClose}
        initialFocusRef={initialFocusRef}
      />
    ),
  };
}
