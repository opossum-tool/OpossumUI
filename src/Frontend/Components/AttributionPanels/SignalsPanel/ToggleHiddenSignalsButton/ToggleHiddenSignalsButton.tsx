// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import MuiBox from '@mui/system/Box';

import { text } from '../../../../../shared/text';

type ToggleHiddenSignalsButtonProps = {
  showHiddenSignals: boolean;
  setShowHiddenSignals: (showHiddenSignals: boolean) => void;
};

export const ToggleHiddenSignalsButton: React.FC<
  ToggleHiddenSignalsButtonProps
> = ({ showHiddenSignals, setShowHiddenSignals }) => {
  const label = showHiddenSignals
    ? text.packageLists.hideDeleted
    : text.packageLists.showDeleted;

  return (
    <MuiIconButton
      aria-label={label}
      size={'small'}
      onClick={() => setShowHiddenSignals(!showHiddenSignals)}
    >
      <MuiTooltip title={label} disableInteractive placement={'top'}>
        <MuiBox sx={{ height: '24px' }}>
          {showHiddenSignals ? <VisibilityIcon /> : <VisibilityOffIcon />}
        </MuiBox>
      </MuiTooltip>
    </MuiIconButton>
  );
};
