// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import MuiBox from '@mui/material/Box';
import { SxProps } from '@mui/system';
import React, { useState } from 'react';

import { text as fullText } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { useProgressData } from '../../state/variables/use-progress-data';
import { SelectedProgressBar } from '../../types/types';
import { ProgressBar } from '../ProgressBar/ProgressBar';

const classes = {
  container: {
    flex: 1,
    display: 'flex',
    marginLeft: '12px',
    marginRight: '12px',
    gap: '4px',
    marginBottom: '4px',
    marginTop: '4px',
  },
  select: {
    width: '150px',
    backgroundColor: OpossumColors.lightestBlue,
    minHeight: 'unset !important',
  },
  progressBar: {
    flex: 1,
  },
} satisfies SxProps;

const text = fullText.topBar.switchableProgressBar;

const progressBarLabels: Record<SelectedProgressBar, string> = {
  attribution: text.attributionProgressBar.selectLabel,
  criticality: text.criticalSignalsBar.selectLabel,
};

export const SwitchableProcessBar: React.FC = () => {
  const [currentProgressBar, setcurrentProgressBar] =
    useState<SelectedProgressBar>('attribution');
  const [progressData] = useProgressData();

  const handleProgressBarChange = (
    event: SelectChangeEvent<SelectedProgressBar>,
  ): void => {
    setcurrentProgressBar(event.target.value as SelectedProgressBar);
  };

  if (!progressData) {
    return <MuiBox flex={1} />;
  }
  return (
    <MuiBox sx={classes.container}>
      <ProgressBar
        sx={classes.progressBar}
        progressBarData={progressData}
        selectedProgressBar={currentProgressBar}
      />
      <Select<SelectedProgressBar>
        size={'small'}
        onChange={handleProgressBarChange}
        sx={classes.select}
        value={currentProgressBar}
        aria-label={text.selectAriaLabel}
      >
        {Object.entries(progressBarLabels).map(([key, progressBarLabel]) => {
          return (
            <MenuItem key={key} value={key}>
              {progressBarLabel}
            </MenuItem>
          );
        })}
      </Select>
    </MuiBox>
  );
};
