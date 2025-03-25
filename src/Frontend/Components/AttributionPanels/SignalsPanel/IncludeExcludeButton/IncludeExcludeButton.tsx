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
import { useUserSettings } from '../../../../state/variables/use-user-setting';

export const IncludeExcludeButton: React.FC = () => {
  const [userSettings, updateUserSettings] = useUserSettings();
  const areHiddenSignalsVisible = userSettings.areHiddenSignalsVisible;
  const label = areHiddenSignalsVisible
    ? text.packageLists.hideDeleted
    : text.packageLists.showDeleted;

  return (
    <MuiIconButton
      aria-label={label}
      size={'small'}
      onClick={() => {
        updateUserSettings((currentSettings) => ({
          areHiddenSignalsVisible: !currentSettings.areHiddenSignalsVisible,
        }));
      }}
    >
      <MuiTooltip title={label} disableInteractive placement={'top'}>
        <MuiBox sx={{ height: '24px' }}>
          {areHiddenSignalsVisible ? <VisibilityIcon /> : <VisibilityOffIcon />}
        </MuiBox>
      </MuiTooltip>
    </MuiIconButton>
  );
};
