// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import MuiToggleButton from '@mui/material/ToggleButton';
import clsx from 'clsx';
import React, { ReactElement } from 'react';
import { OpossumColors } from '../../shared-styles';

const useStyles = makeStyles({
  button: {
    height: 40,
    background: OpossumColors.lightBlue,
    color: OpossumColors.black,
    '&:hover': {
      background: OpossumColors.lightBlueOnHover,
    },
    '&.Mui-selected': {
      background: OpossumColors.darkBlue,
      color: OpossumColors.black,
    },
  },
});

interface ToggleButtonProps {
  buttonText: string;
  selected: boolean;
  handleChange: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function ToggleButton(props: ToggleButtonProps): ReactElement {
  const classes = useStyles();

  return (
    <MuiToggleButton
      value="check"
      selected={props.selected}
      onChange={props.handleChange}
      className={clsx(classes.button, props.className)}
      aria-label={props.ariaLabel}
    >
      {props.buttonText}
    </MuiToggleButton>
  );
}
