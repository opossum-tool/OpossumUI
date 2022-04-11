// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiCheckbox from '@mui/material/Checkbox';
import React, { ReactElement } from 'react';
import MuiTypography from '@mui/material/Typography';
import { OpossumColors } from '../../shared-styles';
import { styled } from '@mui/material/styles';

interface CheckboxProps {
  label?: string;
  disabled?: boolean;
  checked: boolean;
  onChange(event: React.ChangeEvent<HTMLInputElement>): void;
  white?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: any;
}

const CheckboxComponent = styled('div')({
  height: 40,
  display: 'flex',
  alignItems: 'center',
  marginRight: 12,
  marginLeft: -2,
});

export function Checkbox(props: CheckboxProps): ReactElement {
  const whiteMode = props.white ? { color: OpossumColors.white } : {};
  const Component = props.component ?? CheckboxComponent;

  return (
    <Component>
      <MuiCheckbox
        disabled={props.disabled}
        checked={props.checked}
        onChange={props.onChange}
        inputProps={{
          'aria-label': `checkbox ${props.label}`,
        }}
        color={'default'}
        sx={{ '&:root': whiteMode, '&:checked': whiteMode }}
      />
      <MuiTypography
        sx={{
          ...whiteMode,
          color: props.disabled ? OpossumColors.disabledGrey : '',
        }}
      >
        {props.label || ''}
      </MuiTypography>
    </Component>
  );
}
