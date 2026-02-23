// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import MuiBox from '@mui/material/Box';
import { SxProps } from '@mui/system';
import { useState } from 'react';

import { text as fullText } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { useAppSelector } from '../../state/hooks';
import {
  getClassifications,
  getProjectMetadata,
} from '../../state/selectors/resource-selectors';
import { useUserSettings } from '../../state/variables/use-user-setting';
import { SelectedProgressBar } from '../../types/types';
import { backend } from '../../util/backendClient';
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

export const SwitchableProgressBar: React.FC = () => {
  const [userSettings] = useUserSettings();
  const showClassifications = userSettings.showClassifications;
  const showCriticality = userSettings.showCriticality;

  const switchableProgressBarConfiguration: Record<
    SelectedProgressBar,
    ProgressBarSwitchConfiguration
  > = {
    attribution: {
      label: text.attributionBar.selectLabel,
      active: true,
    },
    criticality: {
      label: text.criticalityBar.selectLabel,
      active: showCriticality,
    },
    classification: {
      label: text.classificationBar.selectLabel,
      active: showClassifications,
    },
  };

  const [currentProgressBar, setCurrentProgressBar] =
    useState<SelectedProgressBar>('attribution');

  const projectMetadata = useAppSelector(getProjectMetadata);
  const classifications = useAppSelector(getClassifications);
  // Only get the progress bar, once the project has been initialized. Otherwise we get a DB not initialized error.
  const progressBarData = backend.getProgressBarData.useQuery(
    { classifications },
    { enabled: !!projectMetadata.projectId },
  );

  const handleProgressBarChange = (
    event: SelectChangeEvent<SelectedProgressBar>,
  ): void => {
    setCurrentProgressBar(event.target.value as SelectedProgressBar);
  };

  const effectiveCurrentProgressBar: SelectedProgressBar =
    switchableProgressBarConfiguration[currentProgressBar].active
      ? currentProgressBar
      : 'attribution';

  const activeProgressBarConfigurations = Object.fromEntries(
    Object.entries(switchableProgressBarConfiguration).filter(
      ([_, progressBarSwitchConfiguration]) =>
        progressBarSwitchConfiguration.active,
    ),
  );

  const hasMoreThanOneActiveProgressBar =
    Object.keys(activeProgressBarConfigurations).length > 1;

  if (!progressBarData.data) {
    return <MuiBox flex={1} />;
  }

  return (
    <MuiBox sx={classes.container}>
      <ProgressBar
        sx={classes.progressBar}
        progressBarData={progressBarData.data}
        selectedProgressBar={effectiveCurrentProgressBar}
      />
      {hasMoreThanOneActiveProgressBar && (
        <Select<SelectedProgressBar>
          size={'small'}
          onChange={handleProgressBarChange}
          sx={classes.select}
          value={effectiveCurrentProgressBar}
          aria-label={text.selectAriaLabel}
        >
          {Object.entries(activeProgressBarConfigurations).map(
            ([key, progressBarSwitchConfiguration]) => (
              <MenuItem key={key} value={key}>
                {progressBarSwitchConfiguration.label}
              </MenuItem>
            ),
          )}
        </Select>
      )}
    </MuiBox>
  );
};
