// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import MuiBox from '@mui/system/Box';

import { UserSettings } from '../../../../../shared/shared-types';
import { text } from '../../../../../shared/text';
import { updateUserSettings } from '../../../../state/actions/user-settings-actions/user-settings-actions';
import { useAppDispatch } from '../../../../state/hooks';
import { useAreHiddenSignalsVisible } from '../../../../state/variables/use-are-hidden-signals-visible';

export const IncludeExcludeButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const areHiddenSignalsVisible = useAreHiddenSignalsVisible();
  const label = areHiddenSignalsVisible
    ? text.packageLists.hideDeleted
    : text.packageLists.showDeleted;

  return (
    <MuiIconButton
      aria-label={label}
      size={'small'}
      onClick={() => {
        dispatch(
          updateUserSettings((currentSettings: UserSettings) => ({
            areHiddenSignalsVisible: !currentSettings.areHiddenSignalsVisible,
          })),
        );
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
