// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import { ReactElement } from 'react';

import { text } from '../../../shared/text';
import { ProgressBarWithButtonsData } from '../../types/types';
import { ProgressBar } from '../ProgressBar/ProgressBar';
import { useOnProgressBarClick } from '../ProgressBar/ProgressBar.util';
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

interface ProgressWithButtonsBarProps {
  progressBarWithButtonsData: ProgressBarWithButtonsData;
  showCriticalSignals: boolean;
  onSwitchClick: () => void;
  sx?: SxProps;
}

export function ProgressBarWithButtons({
  progressBarWithButtonsData,
  showCriticalSignals,
  onSwitchClick,
}: ProgressWithButtonsBarProps): ReactElement {
  const onProgressBarClick = useOnProgressBarClick(
    progressBarWithButtonsData.resources
      .withNonInheritedExternalAttributionOnly,
  );
  const resourcesWithCriticalExternalAttributions =
    progressBarWithButtonsData.resources.withHighlyCriticalExternalAttributions.concat(
      progressBarWithButtonsData.resources
        .withMediumCriticalExternalAttributions,
    );
  const onCriticalityBarClick = useOnProgressBarClick(
    resourcesWithCriticalExternalAttributions.length > 0
      ? resourcesWithCriticalExternalAttributions
      : progressBarWithButtonsData.resources
          .withNonInheritedExternalAttributionOnly,
  );

  const onJumpClick = showCriticalSignals
    ? onCriticalityBarClick
    : onProgressBarClick;

  return (
    <>
      <MuiBox sx={classes.progressBarContainer}>
        <ProgressBar
          sx={classes.progressBarContainer}
          progressBarData={progressBarWithButtonsData.count}
          showCriticalSignals={showCriticalSignals}
          onClick={onJumpClick}
        />
        <SwitchWithTooltip
          sx={classes.switch}
          switchToolTipText={
            showCriticalSignals
              ? text.progressBarButtons.switchButtonTooltipCritical
              : text.progressBarButtons.switchButtonTooltipProgress
          }
          isChecked={showCriticalSignals}
          handleSwitchClick={onSwitchClick}
        />
      </MuiBox>
    </>
  );
}
