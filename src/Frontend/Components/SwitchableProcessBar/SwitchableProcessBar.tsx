// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import MuiBox from '@mui/material/Box';
import React, { useState } from 'react';

import { text as fullText } from '../../../shared/text';
import { useProgressData } from '../../state/variables/use-progress-data';
import { ProgressBar } from '../ProgressBar/ProgressBar';

type SelectedProgressBar = 'attribution' | 'criticality';

const classes = {
  progressBarContainer: {
    flex: 1,
    display: 'flex',
    marginLeft: '12px',
    marginRight: '12px',
  },
  select: {
    margin: 'auto',
    width: '150px',
  },
};
interface ProgressBarConfiguration {
  selectLabel: string;
  showCriticalSignals: boolean;
}

const text = fullText.topBar.switchableProgressBar;

const progressBarConfigurations: Record<
  SelectedProgressBar,
  ProgressBarConfiguration
> = {
  attribution: {
    selectLabel: text.attributionProgressBar.selectLabel,
    showCriticalSignals: false,
  },
  criticality: {
    selectLabel: text.criticalSignalsBar.selectLabel,
    showCriticalSignals: true,
  },
};

export const SwitchableProcessBar: React.FC = () => {
  const [currentProgressBar, setCurrentProgressBar] =
    useState<SelectedProgressBar>('attribution');
  const [progressData] = useProgressData();

  const handleProgressBarChange = (
    event: SelectChangeEvent<SelectedProgressBar>,
  ): void => {
    setCurrentProgressBar(event.target.value as SelectedProgressBar);
  };

  if (!progressData) {
    return <MuiBox flex={1} />;
  }
  return (
    <MuiBox sx={classes.progressBarContainer}>
      <ProgressBar
        sx={classes.progressBarContainer}
        progressBarData={progressData}
        showCriticalSignals={
          progressBarConfigurations[currentProgressBar].showCriticalSignals
        }
      />
      <Select<SelectedProgressBar>
        size={'small'}
        onChange={handleProgressBarChange}
        sx={classes.select}
        value={currentProgressBar}
      >
        {Object.entries(progressBarConfigurations).map(
          ([key, progressBarConfiguration]) => {
            return (
              <MenuItem key={key} value={key}>
                {progressBarConfiguration.selectLabel}
              </MenuItem>
            );
          },
        )}
      </Select>
    </MuiBox>
  );
};
