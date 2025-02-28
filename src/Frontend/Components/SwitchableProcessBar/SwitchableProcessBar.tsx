// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { useState } from 'react';

import { useProgressData } from '../../state/variables/use-progress-data';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { SwitchWithTooltip } from '../SwitchWithTooltip/SwitchWithTooltip';

const classes = {
  progressBarContainer: {
    flex: 1,
    display: 'flex',
    marginLeft: '12px',
    marginRight: '12px',
  },
  switch: {
    margin: 'auto',
  },
};

export const SwitchableProcessBar: React.FC = () => {
  const [showCriticalSignals, setShowCriticalSignals] = useState(false);
  const [progressData] = useProgressData();

  function toggleShowCriticalSignals() {
    return () =>
      setShowCriticalSignals(
        (currentShowCriticalSignals: boolean) => !currentShowCriticalSignals,
      );
  }

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
        handleSwitchClick={toggleShowCriticalSignals()}
      />
    </MuiBox>
  );
};
