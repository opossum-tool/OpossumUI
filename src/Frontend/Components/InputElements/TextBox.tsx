// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiTextField from '@mui/material/TextField';
import React, { ReactElement } from 'react';
import { InputElementProps, inputElementClasses } from './shared';
import MuiInputAdornment from '@mui/material/InputAdornment';
import MuiBox from '@mui/material/Box';
import { SxProps } from '@mui/material';

interface TextProps extends InputElementProps {
  textFieldSx?: SxProps;
  minRows?: number;
  maxRows?: number;
  endIcon?: ReactElement;
  multiline?: boolean;
}

export function TextBox(props: TextProps): ReactElement {
  return (
    <MuiBox sx={props.sx}>
      <MuiTextField
        disabled={!props.isEditable}
        sx={{
          ...props.textFieldSx,
          ...inputElementClasses.textField,
          ...(props.isHighlighted
            ? inputElementClasses.highlightedTextField
            : {}),
        }}
        label={props.title}
        InputProps={{
          inputProps: {
            'aria-label': props.title,
          },
          endAdornment: props.endIcon && (
            <MuiInputAdornment position="end">
              {props.endIcon}
            </MuiInputAdornment>
          ),
        }}
        multiline={props.multiline}
        minRows={props.minRows ? props.minRows : 1}
        maxRows={props.maxRows ? props.maxRows : 1}
        variant="outlined"
        size="small"
        value={props.text || ''}
        onChange={props.handleChange}
      />
    </MuiBox>
  );
}
