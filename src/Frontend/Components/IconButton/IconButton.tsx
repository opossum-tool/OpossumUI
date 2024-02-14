// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiButtonBase from '@mui/material/ButtonBase';
import MuiTooltip, { TooltipProps } from '@mui/material/Tooltip';
import { ReactElement } from 'react';

interface IconButtonProps {
  tooltipTitle?: string;
  tooltipPlacement?: TooltipProps['placement'];
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
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
      <span>
        <MuiButtonBase
          aria-label={props.tooltipTitle}
          onClick={(event) => {
            event.stopPropagation();
            props.onClick?.(event);
          }}
          disabled={props.disabled}
          data-testid={props['data-testid']}
        >
          {props.icon}
        </MuiButtonBase>
      </span>
    </MuiTooltip>
  );
}
