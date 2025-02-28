// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import MuiBox from '@mui/material/Box';
import { SxProps } from '@mui/system';
import React, { useState } from 'react';

import { text as fullText } from '../../../shared/text';
import { useProgressData } from '../../state/variables/use-progress-data';
import { ProgressBar } from '../ProgressBar/ProgressBar';

type SelectedProgressBar = 'attribution' | 'criticality';

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

const text = fullText.topBar.switchableProgressBar;

interface ProgressBarConfiguration {
  selectLabel: string;
  showCriticalSignals: boolean;
}

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
    <MuiBox sx={classes.container}>
      <ProgressBar
        sx={{ flex: 1 }}
        progressBarData={progressData}
        showCriticalSignals={
          progressBarConfigurations[currentProgressBar].showCriticalSignals
        }
      />
      <Select<SelectedProgressBar>
        size={'small'}
        onChange={handleProgressBarChange}
        sx={{ margin: 'auto',
          width: '150px'
        }}
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
