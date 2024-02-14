// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiInputAdornment from '@mui/material/InputAdornment';
import MuiTextField, { TextFieldProps } from '@mui/material/TextField';

import { OpossumColors } from '../../shared-styles';
import { ensureArray } from '../../util/ensure-array';

export const classes = {
  textField: {
    width: '100%',
    '& div': {
      backgroundColor: OpossumColors.white,
      borderRadius: '0px',
    },
    '& label': {
      backgroundColor: OpossumColors.white,
      padding: '1px 3px',
      fontSize: '13px',
    },
    '& span': {
      padding: '0px',
    },
    '& legend': {
      '& span': {
        display: 'none',
      },
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgb(192, 192, 192)',
    },
    '& .Mui-readOnly:hover:not(.Mui-focused) fieldset': {
      borderColor: 'rgb(192, 192, 192)',
    },
  },
  defaultHighlightedTextField: {
    '& div': {
      backgroundColor: OpossumColors.lightOrange,
      borderRadius: '0px',
    },
    '& label': {
      backgroundColor: OpossumColors.lightOrange,
      padding: '1px 3px',
    },
  },
  endAdornmentRoot: {
    position: 'absolute',
    right: 0,
    marginRight: '14px',
    height: 0,
  },
} satisfies SxProps;

export interface TextBoxProps {
  color?: TextFieldProps['color'];
  disabled?: boolean;
  expanded?: boolean;
  focused?: boolean;
  handleChange?: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  error?: boolean;
  maxRows?: number;
  minRows?: number;
  multiline?: boolean;
  readOnly?: boolean;
  sx?: SxProps;
  text?: string;
  title?: string;
  endIcon?: React.ReactElement | Array<React.ReactElement>;
}

export function TextBox(props: TextBoxProps) {
  return (
    <MuiBox sx={props.sx}>
      <MuiTextField
        disabled={props.disabled}
        sx={{
          ...classes.textField,
          ...(props.error && classes.defaultHighlightedTextField),
        }}
        label={props.title}
        focused={props.focused}
        color={props.color}
        InputProps={{
          readOnly: props.readOnly,
          slotProps: { root: { sx: { padding: 0 } } },
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
            <MuiInputAdornment sx={classes.endAdornmentRoot} position="end">
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
