// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiInputAdornment from '@mui/material/InputAdornment';
import MuiTextField from '@mui/material/TextField';
import { SystemStyleObject } from '@mui/system/styleFunctionSx';
import { ReactElement } from 'react';

import { HighlightingColor } from '../../enums/enums';
import { getSxFromPropsAndClasses } from '../../util/get-sx-from-props-and-classes';
import { inputElementClasses, InputElementProps } from './shared';

interface TextProps extends InputElementProps {
  textFieldSx?: SxProps;
  textFieldInputSx?: SxProps;
  minRows?: number;
  maxRows?: number;
  endIcon?: ReactElement;
  multiline?: boolean;
  highlightingColor?: HighlightingColor;
}

export function TextBox(props: TextProps): ReactElement {
  const isDefaultHighlighting =
    props.highlightingColor === HighlightingColor.LightOrange ||
    props.highlightingColor === undefined;

  const highlightedStyling = isDefaultHighlighting
    ? inputElementClasses.defaultHighlightedTextField
    : props.highlightingColor === HighlightingColor.DarkOrange
    ? inputElementClasses.strongHighlightedTextField
    : {};

  const textBoxSx = getSxFromPropsAndClasses({
    sxProps: props.isHighlighted ? highlightedStyling : {},
    styleClass: {
      ...(props.textFieldSx as SystemStyleObject),
      ...inputElementClasses.textField,
    },
  });
  return (
    <MuiBox sx={props.sx}>
      <MuiTextField
        disabled={!props.isEditable}
        sx={textBoxSx}
        label={props.title}
        InputProps={{
          inputProps: {
            'aria-label': props.title,
            sx: props.textFieldInputSx,
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
