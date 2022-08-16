// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiButtonBase from '@mui/material/ButtonBase';
import MuiTooltip from '@mui/material/Tooltip';
import { tooltipStyle } from '../../shared-styles';
import { SxProps } from '@mui/material';

interface IconButtonProps {
  tooltipTitle: string;
  tooltipPlacement: 'left' | 'right';
  sx?: SxProps;
  onClick(): void;
  icon: ReactElement;
  disabled?: boolean;
}

export function IconButton(props: IconButtonProps): ReactElement {
  function wrapInTooltip(children: ReactElement): ReactElement {
    return props.disabled ? (
      <span>{children}</span>
    ) : (
      <MuiTooltip
        sx={tooltipStyle}
        title={props.tooltipTitle}
        placement={props.tooltipPlacement}
      >
        {children}
      </MuiTooltip>
    );
  }
  return wrapInTooltip(
    <MuiButtonBase
      sx={props.sx}
      onClick={(event): void => {
        event.stopPropagation();
        props.onClick();
      }}
      disabled={props.disabled}
    >
      {props.icon}
    </MuiButtonBase>
  );
}
