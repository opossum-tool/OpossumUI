// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiCheckbox from '@mui/material/Checkbox';
import React, { ReactElement } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import clsx from 'clsx';
import MuiTypography from '@mui/material/Typography';
import { OpossumColors } from '../../shared-styles';
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';

const useStyles = makeStyles({
  white: {
    color: OpossumColors.white,
  },
  disabledLabel: {
    color: OpossumColors.disabledGrey,
  },
});

interface CheckboxProps {
  label?: string;
  disabled?: boolean;
  checked: boolean;
  onChange(event: React.ChangeEvent<HTMLInputElement>): void;
  sx?: SxProps;
  white?: boolean;
}

export function Checkbox(props: CheckboxProps): ReactElement {
  const classes = useStyles();
  const whiteMode = clsx(props.white && classes.white);
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
        classes={{
          root: whiteMode,
          checked: whiteMode,
        }}
      />
      <MuiTypography
        className={clsx(
          whiteMode,
          props.disabled ? classes.disabledLabel : null
        )}
      >
        {props.label || ''}
      </MuiTypography>
    </MuiBox>
  );
}
