// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiCheckbox from '@mui/material/Checkbox';
import MuiTypography from '@mui/material/Typography';
import { ReactElement } from 'react';

import { OpossumColors } from '../../shared-styles';

const classes = {
  white: {
    color: OpossumColors.white,
  },
  disabledLabel: {
    color: OpossumColors.disabledGrey,
  },
};

interface CheckboxProps {
  label?: string;
  disabled?: boolean;
  checked: boolean;
  onChange(event: React.ChangeEvent<HTMLInputElement>): void;
  sx?: SxProps;
  white?: boolean;
}

export function Checkbox(props: CheckboxProps): ReactElement {
  const whiteMode = props.white ? classes.white : {};

  return (
    <MuiBox sx={props.sx}>
      <MuiCheckbox
        disabled={props.disabled}
        checked={props.checked}
        onChange={props.onChange}
        inputProps={{
          'aria-label': `checkbox ${props.label}`,
        }}
        color={'default'}
        sx={{
          '&.MuiCheckbox-root': whiteMode,
          '&.MuiCheckbox-checked': whiteMode,
        }}
      />
      <MuiTypography
        sx={{
          ...whiteMode,
          ...(props.disabled ? classes.disabledLabel : {}),
        }}
      >
        {props.label || ''}
      </MuiTypography>
    </MuiBox>
  );
}
