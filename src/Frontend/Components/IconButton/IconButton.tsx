// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiButtonBase from '@mui/material/ButtonBase';
import MuiTooltip from '@mui/material/Tooltip';
import { tooltipStyle } from '../../shared-styles';
import { makeStyles } from '@mui/styles';
import clsx from 'clsx';

const useStyles = makeStyles({
  tooltip: tooltipStyle,
});

interface IconButtonProps {
  tooltipTitle: string;
  placement: 'left' | 'right';
  className?: string;
  onClick(): void;
  icon: ReactElement;
  disabled?: boolean;
}

export function IconButton(props: IconButtonProps): ReactElement {
  const classes = useStyles();
  function wrapInTooltip(children: ReactElement): ReactElement {
    return props.disabled ? (
      <span>{children}</span>
    ) : (
      <MuiTooltip
        classes={{ tooltip: classes.tooltip }}
        title={props.tooltipTitle}
        placement={props.placement}
      >
        {children}
      </MuiTooltip>
    );
  }
  return wrapInTooltip(
    <MuiButtonBase
      className={clsx(props.className)}
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
