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

import { text } from '../../../shared/text';
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
    highlighting?: 'error' | 'warning';
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
    disableCloseOnSelect?: boolean;
    forceTop?: boolean;
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
  highlighting,
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
  disableCloseOnSelect,
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
    disableCloseOnSelect,
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
    groupedOptionsRef.current = groupedOptions;
  }, [groupedOptions]);

  const hasPopupIndicator = !freeSolo && !hidePopupIndicator;
  const hasClearButton =
    !disableClearable && !disabled && !readOnly && containsValue;
  const isPopupOpen = !!groupedOptions.length && popupOpen;

  const { ref, color, ...inputProps } = getInputProps();

  const tooltipTitle = (() => {
    if (highlighting === 'error') {
      return text.generic.invalid;
    }
    if (highlighting === 'warning') {
      return text.generic.incomplete;
    }
    return '';
  })();

  return (
    <>
      <Container {...getRootProps()} ref={setAnchorEl}>
        <MuiTooltip title={tooltipTitle} placement="bottom" followCursor>
          <Input
            {...inputProps}
            {...customInputProps}
            background={background}
            variant={variant}
            placeholder={placeholder}
            disabled={disabled}
            color={highlighting}
            label={title}
            numberOfEndAdornments={
              compact([
                hasClearButton,
                hasPopupIndicator,
                ...ensureArray(endAdornment),
              ]).length
            }
            size={'small'}
            inputRef={ref}
            slotProps={{
              input: {
                startAdornment: startAdornment || renderStartAdornment(),
                endAdornment: renderEndAdornment(),
                readOnly,
                sx,
                ...(variant === 'filled' && { disableUnderline: true }),
              },
              inputLabel: getInputLabelProps(),
              htmlInput: {
                'aria-label': props['aria-label'],
                sx: {
                  overflowX: 'hidden',
                  textOverflow: 'ellipsis',
                  '&::placeholder': {
                    opacity: 1,
                  },
                },
              },
            }}
            onKeyDown={(event) => {
              // https://github.com/mui/material-ui/issues/21129
              event.key === 'Backspace' && event.stopPropagation();
            }}
            fullWidth
          />
        </MuiTooltip>
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
    const padding = 16;
    const availableTopHeight = anchorEl
      ? anchorEl.getBoundingClientRect().top - padding
      : undefined;

    return (
      <StyledPopper
        anchorEl={anchorEl}
        open={isPopupOpen}
        forcePlacement={props.forceTop ? 'top' : undefined}
        transition
      >
        {({ TransitionProps }) => (
          <MuiFade {...TransitionProps} timeout={300}>
            <Listbox
              {...getListboxProps()}
              virtuosoRef={virtuosoRef}
              closePopper={closePopper}
              maxHeight={props.forceTop ? availableTopHeight : undefined}
              optionText={optionText}
              options={groupedOptions}
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
