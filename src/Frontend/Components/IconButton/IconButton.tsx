// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiButtonBase from '@mui/material/ButtonBase';
import type { SxProps, Theme } from '@mui/material/styles';
import MuiTooltip, { type TooltipProps } from '@mui/material/Tooltip';

import { OpossumColors } from '../../shared-styles';

interface IconButtonProps {
  tooltipTitle?: string;
  tooltipPlacement?: TooltipProps['placement'];
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  icon: React.ReactElement<unknown>;
  disabled?: boolean;
  hidden?: boolean;
  'data-testid'?: string;
  sx?: SxProps<Theme>;
  wrapperSx?: SxProps<Theme>;
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
      <MuiBox component="span" sx={props.wrapperSx}>
        <MuiButtonBase
          component="button"
          aria-label={props.tooltipTitle}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.stopPropagation();
            props.onClick?.(event);
          }}
          disabled={props.disabled}
          data-testid={props['data-testid']}
          sx={[
            {
              '&.Mui-focusVisible': {
                background: OpossumColors.middleBlue,
              },
            },
            ...(props.sx
              ? Array.isArray(props.sx)
                ? props.sx
                : [props.sx]
              : []),
          ]}
        >
          {props.icon}
        </MuiButtonBase>
      </MuiBox>
    </MuiTooltip>
  );
}
