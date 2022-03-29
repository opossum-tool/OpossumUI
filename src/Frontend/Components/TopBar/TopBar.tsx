// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import makeStyles from '@mui/styles/makeStyles';
import MuiToggleButton from '@mui/material/ToggleButton';
import MuiToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import React, { ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { IpcChannel } from '../../../shared/ipc-channels';
import { View } from '../../enums/enums';
import { setViewOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { getSelectedView } from '../../state/selectors/view-selector';
import { CommitInfoDisplay } from '../CommitInfoDisplay/CommitInfoDisplay';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { OpossumColors } from '../../shared-styles';
import { IconButton } from '../IconButton/IconButton';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { BackendCommunication } from '../BackendCommunication/BackendCommunication';

export const topBarHeight = 36;

const useStyles = makeStyles({
  root: {
    height: topBarHeight,
    background: OpossumColors.darkBlue,
    display: 'flex',
  },
  openFileIcon: {
    margin: 8,
    width: 18,
    height: 18,
    padding: 2,
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
});

export function TopBar(): ReactElement {
  const classes = useStyles();

  const selectedView = useAppSelector(getSelectedView);
  const dispatch = useAppDispatch();

  function handleClick(
    event: React.MouseEvent<HTMLElement>,
    selectedView: View
  ): void {
    dispatch(setViewOrOpenUnsavedPopup(selectedView));
  }

  return (
    <div className={classes.root}>
      <BackendCommunication />
      <IconButton
        tooltipTitle="open file"
        placement="right"
        onClick={(): void => {
          window.ipcRenderer.invoke(IpcChannel.OpenFile);
        }}
        icon={
          <FolderOpenIcon
            className={classes.openFileIcon}
            aria-label={'open file icon'}
          />
        }
      />
      <ProgressBar />
      <MuiToggleButtonGroup
        size="small"
        value={selectedView}
        exclusive
        onChange={handleClick}
      >
        <MuiToggleButton
          value={View.Audit}
          className={classes.viewButtons}
          disabled={selectedView === View.Audit}
        >
          {'Audit'}
        </MuiToggleButton>
        <MuiToggleButton
          value={View.Attribution}
          className={classes.viewButtons}
          disabled={selectedView === View.Attribution}
        >
          {'Attribution'}
        </MuiToggleButton>
        <MuiToggleButton
          value={View.Report}
          className={classes.viewButtons}
          disabled={selectedView === View.Report}
        >
          {'Report'}
        </MuiToggleButton>
      </MuiToggleButtonGroup>
      <div className={classes.versionInfo}>
        <CommitInfoDisplay />
      </div>
    </div>
  );
}
