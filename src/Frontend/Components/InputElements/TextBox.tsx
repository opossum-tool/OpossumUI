// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiInputAdornment from '@mui/material/InputAdornment';
import { InputBaseComponentProps as MuiInputBaseComponentProps } from '@mui/material/InputBase/InputBase';
import MuiTextField from '@mui/material/TextField';

import { HighlightingColor } from '../../enums/enums';
import { AttributionFormConfigAttribute } from '../DiffPopup/DiffPopup';
import { inputElementClasses, InputElementProps } from './shared';

interface TextProps extends InputElementProps {
  rows?: number;
  minRows?: number;
  maxRows?: number;
  endIcon?: React.ReactElement;
  multiline?: boolean;
  highlightingColor?: HighlightingColor;
  error?: boolean;
  inputProps?: MuiInputBaseComponentProps;
  configAttribute?: AttributionFormConfigAttribute;
}

export function TextBox(props: TextProps) {
  const isDefaultHighlighting =
    props.highlightingColor === HighlightingColor.LightOrange ||
    props.highlightingColor === undefined;

  const highlightedStyling = isDefaultHighlighting
    ? inputElementClasses.defaultHighlightedTextField
    : props.highlightingColor === HighlightingColor.DarkOrange
      ? inputElementClasses.strongHighlightedTextField
      : {};

  return (
    <MuiBox sx={props.sx}>
      <MuiTextField
        disabled={!props.isEditable}
        error={props.error}
        sx={{
          ...(props.isHighlighted ? highlightedStyling : {}),
          ...inputElementClasses.textField,
        }}
        label={props.title}
        InputProps={{
          slotProps: {
            root: {
              sx: {
                padding: 0,
              },
            },
          },
          inputProps: {
            'aria-label': props.title,
            sx: {
              overflowX: 'hidden',
              textOverflow: 'ellipsis',
              padding: '8.5px 14px',
              ...(props.configAttribute?.colorValue
                ? {
                    '&.Mui-disabled': {
                      WebkitTextFillColor: props.configAttribute.colorValue,
                    },
                  }
                : {}),
            },
          },
          endAdornment: props.endIcon && (
            <MuiInputAdornment position="end">
              {props.endIcon}
            </MuiInputAdornment>
          ),
        }}
        inputProps={props.inputProps}
        multiline={props.multiline}
        rows={props.rows}
        minRows={props.minRows}
        maxRows={props.maxRows}
        variant="outlined"
        size="small"
        value={props.text || ''}
        onChange={props.handleChange}
      />
    </MuiBox>
  );
}
