// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiButtonBase from '@mui/material/ButtonBase';
import MuiTooltip from '@mui/material/Tooltip';
import { tooltipStyle } from '../../shared-styles';
import { SxProps } from '@mui/material';
import { getSxFromPropsAndClasses } from '../../util/get-sx-from-props-and-classes';

const classes = {
  hidden: {
    visibility: 'hidden',
  },
};

interface IconButtonProps {
  tooltipTitle: string;
  tooltipPlacement: 'left' | 'right';
  sx?: SxProps;
  onClick(): void;
  icon: ReactElement;
  disabled?: boolean;
  hidden?: boolean;
}

export function IconButton(props: IconButtonProps): ReactElement {
  return (
    <MuiTooltip
      describeChild={true}
      sx={tooltipStyle}
      title={props.hidden ? '' : props.tooltipTitle}
      placement={props.tooltipPlacement}
    >
      <span>
        {
          // span is needed to enable tooltips for disabled buttons
        }
        <MuiButtonBase
          aria-label={props.tooltipTitle}
          sx={
            props.hidden
              ? getSxFromPropsAndClasses({
                  styleClass: classes.hidden,
                  sxProps: props.sx,
                })
              : props.sx
          }
          onClick={(event): void => {
            event.stopPropagation();
            props.onClick();
          }}
          disabled={props.disabled}
        >
          {props.icon}
        </MuiButtonBase>
      </span>
    </MuiTooltip>
  );
}
