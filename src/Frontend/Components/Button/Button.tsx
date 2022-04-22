// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiButton from '@mui/material/Button';
import React, { ReactElement } from 'react';
import { buttonStyles } from './button-styles';

interface ButtonProps {
  buttonText: string;
  disabled?: boolean;
  isDark: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function Button(props: ButtonProps): ReactElement {
  return (
    <MuiButton
      sx={props.isDark ? buttonStyles.dark : buttonStyles.light}
      variant="contained"
      disabled={props.disabled}
      onClick={props.onClick}
    >
      {props.buttonText}
    </MuiButton>
  );
}
