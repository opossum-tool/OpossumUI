// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ReactElement } from 'react';
import MuiSwitch from '@mui/material/Switch';
import MuiTooltip from '@mui/material/Tooltip';
import { SxProps } from '@mui/material';

interface SwitchWithTooltipProps {
  sx: SxProps;
  switchToolTipText: string;
  isChecked: boolean;
  handleSwitchClick: () => void;
  ariaLabel: string;
}

export function SwitchWithTooltip(props: SwitchWithTooltipProps): ReactElement {
  return (
    <MuiTooltip title={props.switchToolTipText}>
      <MuiSwitch
        aria-label={props.ariaLabel}
        checked={props.isChecked}
        onChange={props.handleSwitchClick}
        size="small"
        sx={props.sx}
      />
    </MuiTooltip>
  );
}
