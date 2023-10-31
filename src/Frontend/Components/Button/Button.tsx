// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiButton from '@mui/material/Button';
import MuiTooltip from '@mui/material/Tooltip';
import { ReactElement } from 'react';

import { tooltipStyle } from '../../shared-styles';
import { ButtonConfig } from '../../types/types';
import { buttonStyles } from './button-styles';

type ButtonProps = ButtonConfig;

export function Button(props: ButtonProps): ReactElement {
  return (
    <MuiTooltip
      sx={tooltipStyle}
      title={props.tooltipText}
      placement={props.tooltipPlacement}
      describeChild={true}
    >
      <span>
        <MuiButton
          sx={props.isDark ? buttonStyles.dark : buttonStyles.light}
          variant="contained"
          disabled={props.disabled}
          onClick={props.onClick}
        >
          {props.buttonText}
        </MuiButton>
      </span>
    </MuiTooltip>
  );
}
