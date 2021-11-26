// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiTextField from '@mui/material/TextField';
import React, { ReactElement } from 'react';
import { InputElementProps, useInputElementStyles } from './shared';

interface NumericProps extends InputElementProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberBox(props: NumericProps): ReactElement {
  const classes = useInputElementStyles();

  return (
    <div className={props.className}>
      <MuiTextField
        disabled={!props.isEditable}
        className={classes.textField}
        label={props.title}
        InputProps={{
          inputProps: {
            type: 'number',
            min: props.min,
            max: props.max,
            step: props.step,
            'aria-label': props.title,
          },
        }}
        variant="outlined"
        size="small"
        value={isFiniteNumber(props.value) ? props.value : ''}
        onChange={props.handleChange}
      />
    </div>
  );
}

function isFiniteNumber(value: number | null | undefined): boolean {
  return value !== undefined && value !== null && isFinite(value);
}
