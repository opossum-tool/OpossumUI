// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiCheckbox from '@mui/material/Checkbox';
import React, { ReactElement } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import clsx from 'clsx';
import MuiTypography from '@mui/material/Typography';
import { OpossumColors } from '../../shared-styles';

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
  className?: string;
  white?: boolean;
}

export function Checkbox(props: CheckboxProps): ReactElement {
  const classes = useStyles();
  const whiteMode = clsx(props.white && classes.white);
  return (
    <div className={props.className}>
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
    </div>
  );
}
