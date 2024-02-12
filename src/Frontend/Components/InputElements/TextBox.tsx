// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiInputAdornment from '@mui/material/InputAdornment';
import MuiTextField from '@mui/material/TextField';

import { HighlightingColor } from '../../enums/enums';
import { ensureArray } from '../../util/ensure-array';
import { inputElementClasses, InputElementProps } from './shared';

interface TextBoxProps extends InputElementProps {
  minRows?: number;
  maxRows?: number;
  multiline?: boolean;
  highlightingColor?: HighlightingColor;
  error?: boolean;
  expanded?: boolean;
}

export function TextBox(props: TextBoxProps) {
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
        disabled={props.disabled}
        error={props.error}
        sx={{
          ...(props.isHighlighted ? highlightedStyling : {}),
          ...inputElementClasses.textField,
        }}
        label={props.title}
        focused={props.focused}
        color={props.color}
        InputProps={{
          readOnly: props.readOnly,
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
              paddingTop: '8.5px',
              paddingBottom: '8.5px',
              paddingLeft: '14px',
              paddingRight: `calc(14px + ${ensureArray(props.endIcon).length} * 28px)`,
            },
          },
          endAdornment: props.endIcon && (
            <MuiInputAdornment
              sx={inputElementClasses.endAdornmentRoot}
              position="end"
            >
              {props.endIcon}
            </MuiInputAdornment>
          ),
        }}
        multiline={props.multiline}
        minRows={props.expanded ? props.maxRows : props.minRows}
        maxRows={props.maxRows}
        variant="outlined"
        size="small"
        value={props.text || ''}
        onChange={props.handleChange}
      />
    </MuiBox>
  );
}
