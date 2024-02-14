// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import MuiBox from '@mui/material/Box';
import MuiToggleButton from '@mui/material/ToggleButton';
import MuiToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { ReactElement, useState } from 'react';

import { PopupType, View } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { setViewOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import {
  openPopup,
  setOpenFileRequest,
} from '../../state/actions/view-actions/view-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getIsPackageInfoModified } from '../../state/selectors/resource-selectors';
import { getSelectedView } from '../../state/selectors/view-selector';
import { useProgressData } from '../../state/variables/use-progress-data';
import { BackendCommunication } from '../BackendCommunication/BackendCommunication';
import { CommitInfoDisplay } from '../CommitInfoDisplay/CommitInfoDisplay';
import { IconButton } from '../IconButton/IconButton';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { SwitchWithTooltip } from '../SwitchWithTooltip/SwitchWithTooltip';

const classes = {
  root: {
    height: '36px',
    background: OpossumColors.darkBlue,
    display: 'flex',
  },
  progressBarContainer: {
    flex: 1,
    display: 'flex',
    marginLeft: '12px',
    marginRight: '12px',
  },
  switch: {
    margin: 'auto',
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
    margin: '8px 12px 8px 12px',
    color: OpossumColors.white,
    background: OpossumColors.darkBlue,
    float: 'right',
  },
};

export function TopBar(): ReactElement {
  const selectedView = useAppSelector(getSelectedView);
  const dispatch = useAppDispatch();
  const isTemporaryPackageInfoModified = useAppSelector(
    getIsPackageInfoModified,
  );

  const [showCriticalSignals, setShowCriticalSignals] = useState(false);
  const [progressData] = useProgressData();

  function handleClick(
    _: React.MouseEvent<HTMLElement>,
    selectedView: View,
  ): void {
    dispatch(setViewOrOpenUnsavedPopup(selectedView));
  }

  function handleOpenFileClick(): void {
    if (isTemporaryPackageInfoModified) {
      dispatch(setOpenFileRequest(true));
      dispatch(openPopup(PopupType.NotSavedPopup));
    } else {
      void window.electronAPI.openFile();
    }
  }

  return (
    <MuiBox aria-label={'top bar'} sx={classes.root}>
      <BackendCommunication />
      <IconButton
        tooltipTitle="open file"
        tooltipPlacement="right"
        onClick={(): void => {
          handleOpenFileClick();
        }}
        icon={
          <FolderOpenIcon
            sx={classes.openFileIcon}
            aria-label={'open file icon'}
          />
        }
      />
      {renderProgressBar()}
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

  function renderProgressBar() {
    if (!progressData) {
      return <MuiBox flex={1} />;
    }

    return (
      <MuiBox sx={classes.progressBarContainer}>
        <ProgressBar
          sx={classes.progressBarContainer}
          progressBarData={progressData}
          showCriticalSignals={showCriticalSignals}
        />
        <SwitchWithTooltip
          sx={classes.switch}
          switchToolTipText={
            showCriticalSignals
              ? 'Critical signals progress bar selected'
              : 'Progress bar selected'
          }
          isChecked={showCriticalSignals}
          handleSwitchClick={() => setShowCriticalSignals(!showCriticalSignals)}
        />
      </MuiBox>
    );
  }
}
