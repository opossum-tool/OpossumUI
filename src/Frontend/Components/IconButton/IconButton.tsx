// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiButtonBase from '@mui/material/ButtonBase';
import MuiTooltip, { TooltipProps } from '@mui/material/Tooltip';
import { ReactElement } from 'react';

interface IconButtonProps {
  tooltipTitle?: string;
  tooltipPlacement?: TooltipProps['placement'];
  iconSx?: SxProps;
  containerSx?: SxProps;
  onClick?(): void;
  icon: ReactElement;
  disabled?: boolean;
  hidden?: boolean;
  'data-testid'?: string;
}

export function IconButton(props: IconButtonProps) {
  if (props.hidden) {
    return null;
  }

  return (
    <MuiTooltip
      describeChild={true}
      disableInteractive
      title={props.tooltipTitle}
      placement={props.tooltipPlacement}
      enterDelay={1000}
    >
      <MuiBox component="span" sx={props.containerSx}>
        <MuiButtonBase
          aria-label={props.tooltipTitle}
          sx={props.iconSx}
          onClick={(event) => {
            event.stopPropagation();
            props.onClick?.();
          }}
          disabled={props.disabled}
          data-testid={props['data-testid']}
        >
          {props.icon}
        </MuiButtonBase>
      </MuiBox>
    </MuiTooltip>
  );
}
