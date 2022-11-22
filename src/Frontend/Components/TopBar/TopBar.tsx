// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiToggleButton from '@mui/material/ToggleButton';
import MuiToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { View } from '../../enums/enums';
import { setViewOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { getSelectedView } from '../../state/selectors/view-selector';
import { CommitInfoDisplay } from '../CommitInfoDisplay/CommitInfoDisplay';
import { TopProgressBar } from '../ProgressBar/TopProgressBar';
import { OpossumColors } from '../../shared-styles';
import { IconButton } from '../IconButton/IconButton';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { BackendCommunication } from '../BackendCommunication/BackendCommunication';
import MuiBox from '@mui/material/Box';
import { getResources } from '../../state/selectors/all-views-resource-selectors';

export const topBarHeight = 36;

const classes = {
  root: {
    height: `${topBarHeight}px`,
    background: OpossumColors.darkBlue,
    display: 'flex',
  },
  openFileIcon: {
    margin: '8px',
    width: '18px',
    height: '18px',
    padding: '2px',
    color: OpossumColors.white,
    '&:hover': {
      background: OpossumColors.middleBlue,
    },
  },
  viewButtons: {
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
    margin: '8px 12px 8px 12px',
    color: OpossumColors.white,
    background: OpossumColors.darkBlue,
    float: 'right',
  },
};

export function TopBar(): ReactElement {
  const selectedView = useAppSelector(getSelectedView);
  const showTopProgressBar = useAppSelector(getResources) !== null;
  const dispatch = useAppDispatch();

  function handleClick(
    event: React.MouseEvent<HTMLElement>,
    selectedView: View
  ): void {
    dispatch(setViewOrOpenUnsavedPopup(selectedView));
  }

  return (
    <MuiBox sx={classes.root}>
      <BackendCommunication />
      <IconButton
        tooltipTitle="open file"
        tooltipPlacement="right"
        onClick={(): void => {
          window.electronAPI.openFile();
        }}
        icon={
          <FolderOpenIcon
            sx={classes.openFileIcon}
            aria-label={'open file icon'}
          />
        }
      />
      {showTopProgressBar ? <TopProgressBar /> : <MuiBox flex={1} />}
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
          {'Audit'}
        </MuiToggleButton>
        <MuiToggleButton
          value={View.Attribution}
          sx={classes.viewButtons}
          disabled={selectedView === View.Attribution}
        >
          {'Attribution'}
        </MuiToggleButton>
        <MuiToggleButton
          value={View.Report}
          sx={classes.viewButtons}
          disabled={selectedView === View.Report}
        >
          {'Report'}
        </MuiToggleButton>
      </MuiToggleButtonGroup>
      <MuiBox sx={classes.versionInfo}>
        <CommitInfoDisplay />
      </MuiBox>
    </MuiBox>
  );
}
