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
import { useShowClassifications } from '../../state/variables/use-show-classifications';
import { useShowCriticality } from '../../state/variables/use-show-criticality';
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

interface ProgressBarSwitchConfiguration {
  label: string;
  active: boolean;
}

export const SwitchableProcessBar: React.FC = () => {
  const [showClassifications] = useShowClassifications();
  const [showCriticality] = useShowCriticality();

  const switchableProgressBarConfiguration: Record<
    SelectedProgressBar,
    ProgressBarSwitchConfiguration
  > = {
    attribution: {
      label: text.attributionProgressBar.selectLabel,
      active: true,
    },
    criticality: {
      label: text.criticalSignalsBar.selectLabel,
      active: showCriticality,
    },
    classification: {
      label: text.classificationProgressBar.selectLabel,
      active: showClassifications,
    },
  };

  const [currentProgressBar, setcurrentProgressBar] =
    useState<SelectedProgressBar>('attribution');
  const [progressData] = useProgressData();

  const handleProgressBarChange = (
    event: SelectChangeEvent<SelectedProgressBar>,
  ): void => {
    setcurrentProgressBar(event.target.value as SelectedProgressBar);
  };

  const effectiveCurrentProgressBar = switchableProgressBarConfiguration[
    currentProgressBar
  ].active
    ? currentProgressBar
    : 'attribution';

  if (!progressData) {
    return <MuiBox flex={1} />;
  }
  return (
    <MuiBox sx={classes.container}>
      <ProgressBar
        sx={classes.progressBar}
        progressBarData={progressData}
        selectedProgressBar={effectiveCurrentProgressBar}
      />
      <Select<SelectedProgressBar>
        size={'small'}
        onChange={handleProgressBarChange}
        sx={classes.select}
        value={effectiveCurrentProgressBar}
        aria-label={text.selectAriaLabel}
      >
        {Object.entries(switchableProgressBarConfiguration)
          .filter(
            ([_, progressBarSwitchConfiguration]) =>
              progressBarSwitchConfiguration.active,
          )
          .map(([key, progressBarSwitchConfiguration]) => {
            return (
              <MenuItem key={key} value={key}>
                {progressBarSwitchConfiguration.label}
              </MenuItem>
            );
          })}
      </Select>
    </MuiBox>
  );
};
