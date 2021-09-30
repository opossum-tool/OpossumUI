// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ChangeEvent, ReactElement } from 'react';
import { InputElementProps, useInputElementStyles } from './shared';
import MuiAutocomplete from '@material-ui/lab/Autocomplete';
import MuiTextField from '@material-ui/core/TextField';
import clsx from 'clsx';
import MuiInputAdornment from '@material-ui/core/InputAdornment';
import { makeStyles } from '@material-ui/core/styles';

interface AutoCompleteProps extends InputElementProps {
  options: Array<string>;
  endAdornmentText?: string;
}

const useStyles = makeStyles({
  endAdornment: {
    paddingRight: 6,
  },
});

function enterWasPressed(event: KeyboardEvent): boolean {
  return event.which == 13 || event.keyCode == 13;
}

export function AutoComplete(props: AutoCompleteProps): ReactElement {
  const classes = { ...useInputElementStyles(), ...useStyles() };

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
    <div className={props.className}>
      <MuiAutocomplete
        freeSolo
        classes={{ popper: classes.popper }}
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
                    <MuiInputAdornment
                      position="end"
                      className={classes.endAdornment}
                    >
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
              className={clsx(
                classes.textField,
                isInputValueInOptions ? classes.textFieldBoldText : null
              )}
              variant="outlined"
              size="small"
              onChange={props.handleChange}
            />
          );
        }}
      />
    </div>
  );
}
