// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiTextField from '@mui/material/TextField';
import { ReactElement } from 'react';
import { inputElementClasses, InputElementProps } from './shared';
import MuiBox from '@mui/material/Box';

interface NumericProps extends InputElementProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
}

export function NumberBox(props: NumericProps): ReactElement {
  return (
    <MuiBox sx={props.sx}>
      <MuiTextField
        disabled={!props.isEditable}
        sx={{
          ...inputElementClasses.textField,
          ...(props.isHighlighted
            ? inputElementClasses.defaultHighlightedTextField
            : {}),
        }}
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
    </MuiBox>
  );
}

function isFiniteNumber(value: number | null | undefined): boolean {
  return value !== undefined && value !== null && isFinite(value);
}
