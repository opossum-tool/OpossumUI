// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import MuiBox from '@mui/material/Box';
import MuiToggleButton from '@mui/material/ToggleButton';
import MuiToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MuiTypography from '@mui/material/Typography';

import commitInfo from '../../../commitInfo.json';
import { text } from '../../../shared/text';
import { View } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import {
  openFileOrOpenUnsavedPopup,
  setViewOrOpenUnsavedPopup,
} from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getSelectedView } from '../../state/selectors/view-selector';
import { BackendCommunication } from '../BackendCommunication/BackendCommunication';
import { IconButton } from '../IconButton/IconButton';
import { SwitchableProgressBar } from '../SwitchableProgressBar/SwitchableProgressBar';

const classes = {
  root: {
    height: '36px',
    background: OpossumColors.darkBlue,
    display: 'flex',
  },
  openFileIcon: {
    width: '18px',
    height: '18px',
    color: OpossumColors.white,
  },
  openFileButton: {
    aspectRatio: '1 / 1',
    height: '100%',
    display: 'flex',
    '&:hover': {
      background: OpossumColors.middleBlue,
    },
  },
  openFileButtonWrapper: {
    height: '100%',
    display: 'flex',
  },
  viewButtons: {
    width: '80px',
    background: OpossumColors.lightestBlue,
    color: OpossumColors.black,
    border: `2px ${OpossumColors.darkBlue} solid`,
    '&:hover': {
      background: OpossumColors.lightestBlueOnHover,
    },
    '&.Mui-selected': {
      background: OpossumColors.middleBlue,
      color: OpossumColors.black,
      border: `2px ${OpossumColors.darkBlue} solid`,
    },
  },
  versionInfo: {
    sx: {
      mt: 2,
      mr: 3,
      mb: 2,
      ml: 3,
    },
    color: OpossumColors.white,
    background: OpossumColors.darkBlue,
    float: 'right',
  },
  commitDisplay: {
    color: OpossumColors.lightBlue,
    userSelect: 'none',
  },
};

export const TopBar: React.FC = () => {
  const selectedView = useAppSelector(getSelectedView);
  const dispatch = useAppDispatch();

  function handleClick(
    _: React.MouseEvent<HTMLElement>,
    selectedView: View,
  ): void {
    dispatch(setViewOrOpenUnsavedPopup(selectedView));
  }

  function handleOpenFileClick(): void {
    dispatch(openFileOrOpenUnsavedPopup());
  }

  return (
    <MuiBox aria-label={'top bar'} sx={classes.root}>
      <BackendCommunication />
      <IconButton
        sx={classes.openFileButton}
        wrapperSx={classes.openFileButtonWrapper}
        tooltipTitle={text.topBar.openFile.toolTipTitle}
        tooltipPlacement="right"
        onClick={(): void => {
          handleOpenFileClick();
        }}
        icon={
          <FolderOpenIcon
            sx={classes.openFileIcon}
            aria-label={text.topBar.openFile.ariaLabel}
          />
        }
      />
      <SwitchableProgressBar />
      <MuiToggleButtonGroup
        size="small"
        value={selectedView}
        exclusive
        onChange={handleClick}
      >
        <MuiToggleButton
          value={View.Audit}
          sx={classes.viewButtons}
          disabled={selectedView === View.Audit}
        >
          {text.topBar.audit}
        </MuiToggleButton>
        <MuiToggleButton
          value={View.Report}
          sx={classes.viewButtons}
          disabled={selectedView === View.Report}
        >
          {text.topBar.report}
        </MuiToggleButton>
      </MuiToggleButtonGroup>
      <MuiBox sx={classes.versionInfo}>
        <MuiTypography variant={'subtitle2'} sx={classes.commitDisplay}>
          {commitInfo.commitInfo}
        </MuiTypography>
      </MuiBox>
    </MuiBox>
  );
};
