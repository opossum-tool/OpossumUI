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
import { type KeyboardEvent, useId, useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import type { LicenseOption } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { baseIcon, OpossumColors } from '../../shared-styles';
import {
  EndAdornmentContainer,
  Input,
} from '../Autocomplete/Autocomplete.style';
import { StyledCheckIcon } from '../SelectMenu/SelectMenu.style';
import type { FilterOption } from './FilterButton';
import { styles } from './license-editor.style';
import { useLicenseNavigation } from './use-license-navigation';

export interface LicenseConfiguration {
  licenses: Array<LicenseOption>;
  licensesLoading?: boolean;
  selectedLicenses: Array<LicenseOption>;
  setSelectedLicenses: (licenses: Array<LicenseOption>) => void;
}

type LicenseView = 'all' | 'selected';

function LicenseEditor({
  licenses,
  licensesLoading,
  selectedLicenses,
  setSelectedLicenses,
  onBack,
  id: dialogId,
  initialFocusRef,
}: LicenseConfiguration & {
  onBack: () => void;
  id: string;
  initialFocusRef?: (element: HTMLElement | null) => void;
}) {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<LicenseView>('all');
  const [listHeight, setListHeight] = useState(1);
  const listId = useId();
  const selectedIds = useMemo(
    () => new Set(selectedLicenses.map((option) => option.id)),
    [selectedLicenses],
  );
  const options = useMemo(() => {
    const byId = new Map(selectedLicenses.map((option) => [option.id, option]));
    licenses.forEach((option) => byId.set(option.id, option));
    return [...byId.values()].toSorted((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [licenses, selectedLicenses]);
  const normalizedSearch = search.toLowerCase();
  const rows = useMemo(
    () =>
      options.filter(
        (option) =>
          (view === 'all' || selectedIds.has(option.id)) &&
          option.label.toLowerCase().includes(normalizedSearch),
      ),
    [options, selectedIds, view, normalizedSearch],
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
  const toggle = (option: LicenseOption) => {
    activate(option.id);
    setSelectedLicenses(
      selectedIds.has(option.id)
        ? selectedLicenses.filter((value) => value.id !== option.id)
        : [...selectedLicenses, option],
    );
  };
  const handleListKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      event.stopPropagation();
      onBack();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (current) {
        toggle(current);
      }
    } else {
      handleKeyDown(event);
    }
  };
  let emptyMessage: string = text.licenseEditor.noAvailable;
  if (view === 'selected' && !selectedLicenses.length) {
    emptyMessage = text.licenseEditor.noSelected;
  } else if (view === 'all' && licensesLoading) {
    emptyMessage = text.licenseEditor.loading;
  } else if (search) {
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
            label={text.licenseEditor.selected(selectedLicenses.length)}
          />
        </Tabs>
        <Button
          size="small"
          aria-label={text.licenseEditor.clearLicenses}
          sx={styles.clearButton}
          disabled={!selectedLicenses.length}
          onClick={() => setSelectedLicenses([])}
        >
          {text.licenseEditor.clear}
        </Button>
      </Box>
      <Input
        inputRef={initialFocusRef}
        placeholder={text.licenseEditor.search}
        variant="filled"
        size="small"
        background="transparent"
        numberOfEndAdornments={1}
        value={search}
        onChange={(event) => updateSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
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
                label={option.label}
                selected={selectedIds.has(option.id)}
                active={listHasFocus && current?.id === option.id}
                view={view}
                onToggle={() => toggle(option)}
                onRemove={() => {
                  scrollerRef.current?.focus();
                  toggle(option);
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
  label,
  selected,
  active,
  view,
  onToggle,
  onRemove,
}: {
  id: string;
  label: string;
  selected: boolean;
  active: boolean;
  view: LicenseView;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <Box
      id={id}
      role="option"
      aria-labelledby={`${id}-label`}
      aria-selected={selected}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onToggle}
      sx={{
        ...styles.row,
        bgcolor: selected ? OpossumColors.lightestBlue : undefined,
        outline: active ? '1px solid currentColor' : undefined,
      }}
    >
      <Box component="span" id={`${id}-label`} sx={styles.label}>
        {label}
      </Box>
      {view === 'selected' ? (
        <Tooltip title={text.licenseEditor.remove} disableInteractive>
          <IconButton
            aria-label={text.licenseEditor.removeLicense(label)}
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
      )}
    </Box>
  );
}

export function createLicenseFilterOption(
  configuration: LicenseConfiguration,
): FilterOption {
  const { selectedLicenses, licenses } = configuration;
  return {
    id: 'license',
    kind: 'panel',
    selected: !!selectedLicenses.length,
    label:
      selectedLicenses.length === 1
        ? (licenses.find((option) => option.id === selectedLicenses[0].id)
            ?.label ?? selectedLicenses[0].label)
        : selectedLicenses.length
          ? text.licenseEditor.selectionCount(selectedLicenses.length)
          : text.licenseEditor.select,
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
