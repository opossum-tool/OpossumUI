// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { SxProps } from '@mui/system';
import { useState } from 'react';

import { text as fullText } from '../../../shared/text';
import { useProgressData } from '../../state/variables/use-progress-data';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { SwitchWithTooltip } from '../SwitchWithTooltip/SwitchWithTooltip';

const classes = {
  container: {
    flex: 1,
    display: 'flex',
    marginLeft: '12px',
    marginRight: '12px',
    gap: '12px',
  },
  tooltip: {
    margin: 'auto',
  },
} satisfies SxProps;

export const SwitchableProcessBar: React.FC = () => {
  const text = fullText.topBar.switchableProgressBar;
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
    <MuiBox sx={classes.container}>
      <ProgressBar
        sx={{ flex: 1 }}
        progressBarData={progressData}
        showCriticalSignals={showCriticalSignals}
      />
      <SwitchWithTooltip
        sx={classes.tooltip}
        switchToolTipText={
          showCriticalSignals
            ? text.criticalSignalsBar.switcherTooltip
            : text.defaultProgressBar.switcherTooltip
        }
        isChecked={showCriticalSignals}
        handleSwitchClick={toggleShowCriticalSignals()}
      />
    </MuiBox>
  );
};
