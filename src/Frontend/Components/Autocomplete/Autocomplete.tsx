// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiChip from '@mui/material/Chip';
import MuiFade from '@mui/material/Fade';
import { IconButtonProps as MuiIconButtonProps } from '@mui/material/IconButton';
import { InputBaseComponentProps as MuiInputBaseComponentProps } from '@mui/material/InputBase';
import useMuiAutocomplete, {
  AutocompleteHighlightChangeReason,
  AutocompleteInputChangeReason,
  UseAutocompleteProps as MuiUseAutocompleteProps,
} from '@mui/material/useAutocomplete';
import { compact } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { VirtuosoHandle } from 'react-virtuoso';

import { ClearButton } from '../ClearButton/ClearButton';
import { PopupIndicator } from '../PopupIndicator/PopupIndicator';
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
    endAdornment?: React.ReactNode;
    highlight?: 'default' | 'dark';
    inputProps?: MuiInputBaseComponentProps;
    onInputChange?: (
      event: React.SyntheticEvent | undefined,
      value: string,
      reason: AutocompleteInputChangeReason,
    ) => void;
    sx?: SxProps;
    title: string;
  };

export function Autocomplete<
  Value,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
>({
  disableClearable,
  disableListWrap = true,
  disabled,
  endAdornment,
  freeSolo,
  getOptionKey,
  getOptionLabel,
  groupBy,
  groupProps,
  highlight,
  inputProps,
  multiple,
  optionText,
  renderOptionEndIcon,
  renderOptionStartIcon,
  sx,
  title,
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
    ...props,
  });

  useEffect(() => {
    groupedOptionsRef.current = groupedOptions as Array<Value>;
  }, [groupedOptions]);

  const hasPopupIndicator = !freeSolo;
  const hasClearButton = !disableClearable && !disabled && containsValue;
  const isPopupOpen = !!groupedOptions.length && popupOpen;

  return (
    <>
      <Container {...getRootProps()} sx={sx} ref={setAnchorEl}>
        <Input
          disabled={disabled}
          label={title}
          highlight={highlight}
          numberOfEndAdornments={
            compact([hasClearButton, hasPopupIndicator, !!endAdornment]).length
          }
          size={'small'}
          InputLabelProps={getInputLabelProps()}
          inputProps={{ ...getInputProps(), ...inputProps }}
          InputProps={{
            startAdornment: renderStartAdornment(),
            endAdornment: renderEndAdornment(),
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
        <MuiChip
          size={'small'}
          key={key}
          label={label}
          {...tagProps}
          data-testid={`tag-${label}`}
        />
      );
    });
  }

  function renderEndAdornment() {
    if (!endAdornment && !hasPopupIndicator && !hasClearButton) {
      return null;
    }

    return (
      <EndAdornmentContainer>
        {hasClearButton && (
          <ClearButton {...(getClearProps() as MuiIconButtonProps)} />
        )}
        {hasPopupIndicator && (
          <PopupIndicator
            popupOpen={isPopupOpen}
            {...(getPopupIndicatorProps() as MuiIconButtonProps)}
          />
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
