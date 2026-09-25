// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-magic-numbers */
import type { InputBaseComponentsPropsOverrides, SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiInputAdornment from '@mui/material/InputAdornment';
import type { Theme } from '@mui/material/styles';
import MuiTextareaAutosize, {
  type TextareaAutosizeProps,
} from '@mui/material/TextareaAutosize';
import MuiTextField, { type TextFieldProps } from '@mui/material/TextField';
import MuiTooltip, { type TooltipProps } from '@mui/material/Tooltip';

import { OpossumColors } from '../../shared-styles';
import { ensureArray } from '../../util/ensure-array';

const INPUT_VERTICAL_PADDING = '8.5px';

const classes = {
  textField: {
    width: '100%',
    '& div': {
      backgroundColor: OpossumColors.white,
      borderRadius: 0,
    },
    '& label[data-shrink=true]': {
      backgroundColor: OpossumColors.white,
      py: 0.25,
      px: 0.75,
      fontSize: (theme: Theme) => theme.typography.body3.fontSize,
    },
    '& span': {
      p: 0,
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
    '& .Mui-readOnly.Mui-focused fieldset': {
      borderColor: 'rgb(192, 192, 192)',
      borderWidth: ({ spacing }: Theme) => spacing(0.25),
    },
  },
  defaultHighlightedTextField: {
    '& div': {
      backgroundColor: OpossumColors.lightOrange,
      borderRadius: 0,
    },
    '& label[data-shrink=true]': {
      backgroundColor: OpossumColors.lightOrange,
      py: 0.25,
      px: 0.75,
    },
  },
  startAdornmentRoot: {
    position: 'absolute',
    left: 0,
    ml: 2,
    height: 0,
  },
  endAdornmentRoot: {
    position: 'absolute',
    right: 0,
    mr: 2,
    height: 0,
  },
  multilineEndAdornmentRoot: {
    position: 'sticky',
    top: '50%',
    transform: 'translateY(-50%)',
    height: 'auto',
    marginTop: 0,
    marginLeft: 0,
    mr: 2,
  },
} satisfies SxProps<Theme>;

function MultilineInput({
  maxRows,
  endAdornment,
  ...props
}: TextareaAutosizeProps & {
  endAdornment?: React.ReactNode;
}) {
  return (
    <MuiBox
      sx={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        alignItems: 'start',
        boxSizing: 'content-box',
        width: '100%',
        overflow: 'auto',
        paddingBlock: 2.125,
        scrollPaddingBlock: INPUT_VERTICAL_PADDING,
        maxBlockSize: maxRows ? `${maxRows}lh` : 'none',
      }}
    >
      <MuiTextareaAutosize {...props} />
      {endAdornment && (
        <MuiInputAdornment
          sx={classes.multilineEndAdornmentRoot}
          position="end"
        >
          {endAdornment}
        </MuiInputAdornment>
      )}
    </MuiBox>
  );
}

export type TextBoxCustomInputProps =
  React.InputHTMLAttributes<HTMLInputElement> &
    InputBaseComponentsPropsOverrides & {
      sx?: SxProps<Theme>;
      'data-testid'?: string;
    };

export interface TextBoxProps {
  inputDataTestId?: string;
  rootDataTestId?: string;
  color?: TextFieldProps['color'];
  placeholder?: string;
  disabled?: boolean;
  expanded?: boolean;
  focused?: boolean;
  handleChange?: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onClick?: () => void;
  error?: boolean;
  maxRows?: number;
  minRows?: number;
  multiline?: boolean;
  readOnly?: boolean;
  sx?: SxProps;
  text?: string;
  title: string;
  startIcon?: React.ReactElement | Array<React.ReactElement>;
  endIcon?: React.ReactElement | Array<React.ReactElement>;
  cursor?: React.CSSProperties['cursor'];
  showTooltip?: boolean;
  tooltipProps?: Partial<TooltipProps>;
  inputComponent?: React.ElementType<TextBoxCustomInputProps>;
}

export function TextBox(props: TextBoxProps) {
  const minRows = props.expanded ? props.maxRows : props.minRows;
  return (
    <MuiBox data-testid={props.rootDataTestId} sx={props.sx}>
      <MuiTooltip
        title={props.showTooltip && props.text}
        disableInteractive={true}
        {...props.tooltipProps}
      >
        <MuiTextField
          disabled={props.disabled}
          placeholder={props.placeholder}
          sx={{
            ...classes.textField,
            ...(props.error && classes.defaultHighlightedTextField),
          }}
          label={props.title}
          focused={props.focused}
          color={props.color}
          slotProps={{
            inputLabel: {
              shrink: !!props.placeholder || !!props.text,
              sx: {
                ml: ensureArray(props.startIcon).length * 5,
              },
            },
            input: {
              readOnly: props.readOnly,
              inputComponent: props.multiline ? MultilineInput : undefined,
              slotProps: {
                input: {
                  'aria-label': props.title,
                  value: props.text || '',
                  ...(props.multiline
                    ? {
                        minRows,
                        maxRows: props.maxRows,
                        endAdornment: props.endIcon,
                      }
                    : {}),
                  ...(props.inputDataTestId
                    ? { 'data-testid': props.inputDataTestId }
                    : {}),
                  sx: {
                    ...(props.multiline ? { boxSizing: 'border-box' } : {}),
                    overflowX: 'hidden',
                    textOverflow: 'ellipsis',
                    paddingY: props.multiline ? 0 : 2.125,
                    paddingLeft: 3.5 + ensureArray(props.startIcon).length * 5,
                    paddingRight: props.multiline
                      ? 3.5
                      : 3.5 + ensureArray(props.endIcon).length * 5,
                  },
                },
              },
              sx: { padding: 0, cursor: props.cursor },
              slots: { input: props.inputComponent },
              startAdornment: props.startIcon && (
                <MuiInputAdornment
                  sx={{ ...classes.startAdornmentRoot }}
                  position="start"
                >
                  {props.startIcon}
                </MuiInputAdornment>
              ),
              endAdornment: !props.multiline && props.endIcon && (
                <MuiInputAdornment sx={classes.endAdornmentRoot} position="end">
                  {props.endIcon}
                </MuiInputAdornment>
              ),
            },
          }}
          multiline={props.multiline}
          minRows={minRows}
          maxRows={props.maxRows}
          variant="outlined"
          size="small"
          value={props.text || ''}
          onChange={props.handleChange}
          onClick={props.onClick}
        />
      </MuiTooltip>
    </MuiBox>
  );
}
