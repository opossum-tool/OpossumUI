// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiSwitch from '@mui/material/Switch';
import MuiTooltip from '@mui/material/Tooltip';

interface SwitchWithTooltipProps {
  sx: SxProps;
  switchToolTipText: string;
  isChecked: boolean;
  handleSwitchClick: () => void;
}

export const SwitchWithTooltip: React.FC<SwitchWithTooltipProps> = (props) => {
  return (
    <MuiTooltip title={props.switchToolTipText}>
      <MuiSwitch
        checked={props.isChecked}
        onChange={props.handleSwitchClick}
        size="small"
        sx={props.sx}
      />
    </MuiTooltip>
  );
};
