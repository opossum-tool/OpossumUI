// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiTextField from '@material-ui/core/TextField';
import React, { ReactElement } from 'react';
import { InputElementProps, useInputElementStyles } from './shared';
import clsx from 'clsx';

interface TextProps extends InputElementProps {
  textFieldClassname?: string;
  minRows?: number;
  maxRows?: number;
}

export function TextBox(props: TextProps): ReactElement {
  const classes = useInputElementStyles();

  return (
    <div className={props.className}>
      <MuiTextField
        disabled={!props.isEditable}
        className={clsx(props.textFieldClassname, classes.textField)}
        label={props.title}
        InputProps={{
          inputProps: {
            'aria-label': props.title,
          },
        }}
        multiline
        minRows={props.minRows ? props.minRows : 1}
        maxRows={props.maxRows ? props.maxRows : 1}
        variant="outlined"
        size="small"
        value={props.text || ''}
        onChange={props.handleChange}
      />
    </div>
  );
}
