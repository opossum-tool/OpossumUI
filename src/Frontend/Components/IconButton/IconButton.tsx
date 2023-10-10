// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from 'react';
import MuiButtonBase from '@mui/material/ButtonBase';
import MuiTooltip from '@mui/material/Tooltip';
import { SxProps } from '@mui/material';
import { getSxFromPropsAndClasses } from '../../util/get-sx-from-props-and-classes';
import MuiBox from '@mui/material/Box';

const classes = {
  hidden: {
    visibility: 'hidden',
  },
};

interface IconButtonProps {
  tooltipTitle: string;
  tooltipPlacement: 'left' | 'right';
  iconSx?: SxProps;
  containerSx?: SxProps;
  onClick(): void;
  icon: ReactElement;
  disabled?: boolean;
  hidden?: boolean;
}

export function IconButton(props: IconButtonProps): ReactElement {
  return (
    <MuiTooltip
      describeChild={true}
      title={props.hidden ? '' : props.tooltipTitle}
      placement={props.tooltipPlacement}
    >
      <MuiBox component="span" sx={props.containerSx}>
        {
          // the container is needed to enable tooltips for disabled buttons
        }
        <MuiButtonBase
          aria-label={props.tooltipTitle}
          sx={
            props.hidden
              ? getSxFromPropsAndClasses({
                  styleClass: classes.hidden,
                  sxProps: props.iconSx,
                })
              : props.iconSx
          }
          onClick={(event): void => {
            event.stopPropagation();
            props.onClick();
          }}
          disabled={props.disabled}
        >
          {props.icon}
        </MuiButtonBase>
      </MuiBox>
    </MuiTooltip>
  );
}
