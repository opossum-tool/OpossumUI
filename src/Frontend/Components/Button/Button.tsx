// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiButton from '@mui/material/Button';
import React, { ReactElement } from 'react';
import clsx from 'clsx';
import { useButtonStyles } from './button-styles';

interface ButtonProps {
  buttonText: string;
  disabled?: boolean;
  isDark: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export function Button(props: ButtonProps): ReactElement {
  const classes = useButtonStyles();
  return (
    <MuiButton
      classes={{
        root: clsx(
          props.isDark ? classes.dark : classes.light,
          props.className
        ),
      }}
      variant="contained"
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.buttonText}
    </MuiButton>
  );
}
