// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { ReactElement, useState } from 'react';

import { useOverallProgressData } from '../../web-workers/use-signals-worker';
import { SwitchWithTooltip } from '../SwitchWithTooltip/SwitchWithTooltip';
import { ProgressBar } from './ProgressBar';

const classes = {
  root: {
    flex: 1,
    display: 'flex',
    marginLeft: '12px',
    marginRight: '12px',
  },
  switch: {
    margin: 'auto',
  },
};

export function TopProgressBar(): ReactElement {
  const [progressBarCriticalityState, setProgressBarCriticalityState] =
    useState<boolean>(false);

  const handleSwitchClick = (): void => {
    setProgressBarCriticalityState(!progressBarCriticalityState);
  };
  const switchToolTipText = progressBarCriticalityState
    ? 'Critical signals progress bar selected'
    : 'Progress bar selected';

  const progressData = useOverallProgressData();

  return progressData ? (
    <MuiBox sx={classes.root}>
      <ProgressBar
        sx={classes.root}
        progressBarType={'TopProgressBar'}
        progressBarData={progressData}
        progressBarCriticalityState={progressBarCriticalityState}
      />
      <SwitchWithTooltip
        sx={classes.switch}
        switchToolTipText={switchToolTipText}
        isChecked={progressBarCriticalityState}
        handleSwitchClick={handleSwitchClick}
      />
    </MuiBox>
  ) : (
    <MuiBox aria-label={'TopProgressBar'} sx={classes.root} />
  );
}
