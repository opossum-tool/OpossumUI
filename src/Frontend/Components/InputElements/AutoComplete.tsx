// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ChangeEvent, ReactElement } from 'react';
import { inputElementClasses, InputElementProps } from './shared';
import MuiAutocomplete from '@mui/material/Autocomplete';
import MuiTextField from '@mui/material/TextField';
import MuiInputAdornment from '@mui/material/InputAdornment';
import MuiBox from '@mui/material/Box';

interface AutoCompleteProps extends InputElementProps {
  options: Array<string>;
  endAdornmentText?: string;
}

const classes = {
  ...inputElementClasses,
  endAdornment: {
    paddingRight: '6px',
  },
};

function enterWasPressed(event: KeyboardEvent): boolean {
  return event.which == 13 || event.keyCode == 13;
}

export function AutoComplete(props: AutoCompleteProps): ReactElement {
  function onInputChange(
    event: ChangeEvent<unknown> | KeyboardEvent,
    value: string
  ): void {
    if (
      value &&
      event &&
      (event.type === 'click' || enterWasPressed(event as KeyboardEvent))
    ) {
      props.handleChange({ target: { value } } as unknown as ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement
      >);
    }
  }

  const inputValue = props.text || '';
  const inputValueIndexInOptions: number = props.options.indexOf(inputValue);
  const isInputValueInOptions: boolean = inputValueIndexInOptions > -1;

  return (
    <MuiBox sx={props.sx}>
      <MuiAutocomplete
        freeSolo
        sx={{
          ...(props.isHighlighted
            ? { '&.MuiAutocomplete-root': classes.highlightedTextField }
            : {}),
          ...classes.popper,
        }}
        options={props.options}
        disableClearable={true}
        disabled={!props.isEditable}
        inputValue={inputValue}
        onInputChange={onInputChange}
        renderInput={(params): ReactElement => {
          const paramsWithAdornment = props.endAdornmentText
            ? {
                ...params,
                InputProps: {
                  ...params.InputProps,
                  endAdornment: (
                    <MuiInputAdornment position="end" sx={classes.endAdornment}>
                      {props.endAdornmentText}
                    </MuiInputAdornment>
                  ),
                },
              }
            : params;

          return (
            <MuiTextField
              {...paramsWithAdornment}
              label={props.title}
              sx={{
                ...classes.textField,
                ...(isInputValueInOptions ? classes.textFieldBoldText : {}),
              }}
              variant="outlined"
              size="small"
              onChange={props.handleChange}
            />
          );
        }}
      />
    </MuiBox>
  );
}
