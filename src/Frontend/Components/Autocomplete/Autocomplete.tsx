// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClearIcon from '@mui/icons-material/Clear';
import { TextFieldProps as MuiTextFieldProps, SxProps } from '@mui/material';
import MuiChip from '@mui/material/Chip';
import MuiFade from '@mui/material/Fade';
import MuiIconButton, {
  IconButtonProps as MuiIconButtonProps,
} from '@mui/material/IconButton';
import { TextFieldProps as MuiInputProps } from '@mui/material/TextField';
import MuiTooltip from '@mui/material/Tooltip';
import useMuiAutocomplete, {
  AutocompleteHighlightChangeReason,
  AutocompleteInputChangeReason,
  UseAutocompleteProps as MuiUseAutocompleteProps,
} from '@mui/material/useAutocomplete';
import { compact } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { VirtuosoHandle } from 'react-virtuoso';

import { ensureArray } from '../../util/ensure-array';
import {
  Container,
  EndAdornmentContainer,
  Input,
  StyledPopper,
} from './Autocomplete.style';
import { Listbox, ListboxProps } from './Listbox/Listbox';

type AutocompleteProps<
  Value,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
> = Omit<
  MuiUseAutocompleteProps<Value, Multiple, DisableClearable, FreeSolo>,
  'onClose' | 'onOpen' | 'open' | 'onHighlightChange' | 'onInputChange'
> &
  Pick<
    ListboxProps<Value, FreeSolo>,
    | 'getOptionKey'
    | 'groupProps'
    | 'optionText'
    | 'renderOptionEndIcon'
    | 'renderOptionStartIcon'
  > & {
    ['aria-label']?: string;
    background?: string;
    endAdornment?: React.ReactNode | Array<React.ReactNode>;
    error?: boolean;
    inputProps?: MuiInputProps;
    onInputChange?: (
      event: React.SyntheticEvent | undefined,
      value: string,
      reason: AutocompleteInputChangeReason,
    ) => void;
    placeholder?: string;
    hidePopupIndicator?: boolean;
    startAdornment?: React.ReactNode;
    sx?: SxProps;
    title?: string;
    variant?: MuiTextFieldProps['variant'];
  };

export function Autocomplete<
  Value,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
>({
  background,
  disableClearable,
  disableListWrap = true,
  disabled,
  endAdornment,
  error,
  freeSolo,
  getOptionKey,
  getOptionLabel,
  groupBy,
  groupProps,
  hidePopupIndicator,
  inputProps: customInputProps,
  multiple,
  optionText,
  placeholder,
  readOnly,
  renderOptionEndIcon,
  renderOptionStartIcon,
  startAdornment,
  sx,
  title,
  variant = 'outlined',
  ...props
}: AutocompleteProps<Value, Multiple, DisableClearable, FreeSolo>) {
  const [open, setOpen] = useState(false);
  const closePopper = () => setOpen(false);

  const groupedOptionsRef = useRef<Array<Value> | null>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const onHighlightChange = useCallback(
    (
      event: React.SyntheticEvent,
      option: Value | null,
      reason: AutocompleteHighlightChangeReason,
    ) => {
      if (reason !== 'keyboard' || event.type !== 'keydown' || !option) {
        return;
      }

      const index = groupedOptionsRef.current?.findIndex(
        (item) => item === option,
      );

      if (index !== undefined) {
        virtuosoRef.current?.scrollToIndex({
          index,
          behavior: 'auto',
          align: 'center',
        });
      }
    },
    [],
  );

  const {
    anchorEl,
    dirty: containsValue,
    getClearProps,
    getInputLabelProps,
    getInputProps,
    getListboxProps,
    getOptionProps,
    getPopupIndicatorProps,
    getRootProps,
    getTagProps,
    groupedOptions,
    popupOpen,
    setAnchorEl,
    value,
  } = useMuiAutocomplete<Value, Multiple, DisableClearable, FreeSolo>({
    disableClearable,
    disableListWrap,
    disabled,
    freeSolo,
    getOptionLabel,
    multiple,
    onClose: () => setOpen(false),
    onHighlightChange,
    onOpen: () => setOpen(true),
    open,
    readOnly,
    ...props,
  });

  useEffect(() => {
    groupedOptionsRef.current = groupedOptions as Array<Value>;
  }, [groupedOptions]);

  const hasPopupIndicator = !freeSolo && !hidePopupIndicator;
  const hasClearButton =
    !disableClearable && !disabled && !readOnly && containsValue;
  const isPopupOpen = !!groupedOptions.length && popupOpen;

  const { ref, color, ...inputProps } = getInputProps();

  return (
    <>
      <Container {...getRootProps()} ref={setAnchorEl}>
        <Input
          {...inputProps}
          {...customInputProps}
          background={background}
          variant={variant}
          placeholder={placeholder}
          disabled={disabled}
          error={error}
          label={title}
          numberOfEndAdornments={
            compact([
              hasClearButton,
              hasPopupIndicator,
              ...ensureArray(endAdornment),
            ]).length
          }
          size={'small'}
          InputLabelProps={getInputLabelProps()}
          inputRef={ref}
          inputProps={{
            'aria-label': props['aria-label'],
            sx: {
              overflowX: 'hidden',
              textOverflow: 'ellipsis',
              '&::placeholder': {
                opacity: 1,
              },
            },
          }}
          InputProps={{
            startAdornment: startAdornment || renderStartAdornment(),
            endAdornment: renderEndAdornment(),
            readOnly,
            sx,
            ...(variant === 'filled' && { disableUnderline: true }),
          }}
          onKeyDown={(event) => {
            // https://github.com/mui/material-ui/issues/21129
            event.key === 'Backspace' && event.stopPropagation();
          }}
          fullWidth
        />
      </Container>
      {renderPopper()}
    </>
  );

  function renderStartAdornment() {
    if (!multiple || !Array.isArray(value) || !value.length) {
      return null;
    }

    return value.map((option, index) => {
      const { key, ...tagProps } = getTagProps({ index });
      const label = getOptionLabel?.(option) ?? option;

      return (
        <MuiTooltip title={label} key={key}>
          <MuiChip
            size={'small'}
            label={label}
            {...tagProps}
            onMouseDown={(event) => event.stopPropagation()}
            data-testid={`tag-${label}`}
            sx={{ cursor: 'default' }}
          />
        </MuiTooltip>
      );
    });
  }

  function renderEndAdornment() {
    if (!endAdornment && !hasPopupIndicator && !hasClearButton) {
      return null;
    }

    return (
      <EndAdornmentContainer
        onClick={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {hasClearButton && (
          <MuiIconButton
            aria-label={'clear button'}
            size={'small'}
            sx={{ padding: '4px' }}
            {...(getClearProps() as MuiIconButtonProps)}
          >
            <ClearIcon fontSize={'small'} />
          </MuiIconButton>
        )}
        {hasPopupIndicator && (
          <MuiIconButton
            sx={{
              padding: '2px',
              transform: popupOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
            }}
            aria-label={'popup indicator'}
            size={'small'}
            {...(getPopupIndicatorProps() as MuiIconButtonProps)}
          >
            <ArrowDropDownIcon />
          </MuiIconButton>
        )}
        {endAdornment}
      </EndAdornmentContainer>
    );
  }

  function renderPopper() {
    return (
      <StyledPopper anchorEl={anchorEl} open={isPopupOpen} transition>
        {({ TransitionProps }) => (
          <MuiFade {...TransitionProps} timeout={300}>
            <Listbox
              {...getListboxProps()}
              virtuosoRef={virtuosoRef}
              closePopper={closePopper}
              optionText={optionText}
              options={groupedOptions as Array<Value>}
              groupBy={groupBy}
              groupProps={groupProps}
              getOptionKey={getOptionKey}
              getOptionProps={getOptionProps}
              renderOptionStartIcon={renderOptionStartIcon}
              renderOptionEndIcon={renderOptionEndIcon}
            />
          </MuiFade>
        )}
      </StyledPopper>
    );
  }
}
