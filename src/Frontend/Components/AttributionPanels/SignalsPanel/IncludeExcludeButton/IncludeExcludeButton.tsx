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
import { useAreHiddenSignalsVisible } from '../../../../state/variables/use-are-hidden-signals-visible';

export const IncludeExcludeButton: React.FC = () => {
  const [areHiddenSignalsVisible, setAreHiddenSignalsVisible] =
    useAreHiddenSignalsVisible();

  return (
    <MuiIconButton
      aria-label={'include or exclude hidden signals button'}
      size={'small'}
      onClick={() => setAreHiddenSignalsVisible((prev) => !prev)}
    >
      <MuiTooltip
        title={
          areHiddenSignalsVisible
            ? text.packageLists.hideDeleted
            : text.packageLists.showDeleted
        }
        disableInteractive
        placement={'top'}
      >
        <MuiBox sx={{ height: '24px' }}>
          {areHiddenSignalsVisible ? <VisibilityIcon /> : <VisibilityOffIcon />}
        </MuiBox>
      </MuiTooltip>
    </MuiIconButton>
  );
};
