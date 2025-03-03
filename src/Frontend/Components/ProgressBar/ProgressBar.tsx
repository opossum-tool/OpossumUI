// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiTooltip from '@mui/material/Tooltip';

import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { ProgressBarData, SelectedProgressBar } from '../../types/types';
import {
  getCriticalityBarBackground,
  getCriticalityBarTooltipText,
  getProgressBarBackground,
  getProgressBarTooltipText,
  useOnProgressBarClick,
} from './ProgressBar.util';

const classes = {
  bar: {
    flex: 1,
    border: `2px solid ${OpossumColors.white}`,
    marginTop: '2px',
    height: '20px',
    '&:hover': {
      cursor: 'pointer',
      opacity: 0.75,
    },
  },
};

interface ProgressBarInternals {
  tooltipText: React.ReactNode;
  ariaLabel: string;
  background: string;
  onClickHandler: () => void;
}

interface ProgressBarProps {
  sx?: SxProps;
  progressBarData: ProgressBarData;
  selectedProgressBar: SelectedProgressBar;
}

export const ProgressBar: React.FC<ProgressBarProps> = (props) => {
  const onProgressBarClick = useOnProgressBarClick(
    props.progressBarData.resourcesWithNonInheritedExternalAttributionOnly,
  );
  const resourcesWithCriticalExternalAttributions =
    props.progressBarData.resourcesWithHighlyCriticalExternalAttributions.concat(
      props.progressBarData.resourcesWithMediumCriticalExternalAttributions,
    );
  const onCriticalityBarClick = useOnProgressBarClick(
    resourcesWithCriticalExternalAttributions.length > 0
      ? resourcesWithCriticalExternalAttributions
      : props.progressBarData.resourcesWithNonInheritedExternalAttributionOnly,
  );

  const progressBarConfiguration: Record<
    SelectedProgressBar,
    ProgressBarInternals
  > = {
    attribution: {
      tooltipText: getProgressBarTooltipText(props.progressBarData),
      ariaLabel:
        text.topBar.switchableProgressBar.attributionProgressBar.ariaLabel,
      background: getProgressBarBackground(props.progressBarData),
      onClickHandler: onProgressBarClick,
    },
    criticality: {
      tooltipText: getCriticalityBarTooltipText(props.progressBarData),
      ariaLabel: text.topBar.switchableProgressBar.criticalSignalsBar.ariaLabel,
      background: getCriticalityBarBackground(props.progressBarData),
      onClickHandler: onCriticalityBarClick,
    },
    classification: {
      tooltipText: getCriticalityBarTooltipText(props.progressBarData), // ToDo: Update
      ariaLabel:
        text.topBar.switchableProgressBar.classificationProgressBar.ariaLabel,
      background: getCriticalityBarBackground(props.progressBarData), // ToDo: Update
      onClickHandler: onCriticalityBarClick, // ToDo: Update
    },
  };

  const currentProgressBarConfiguration =
    progressBarConfiguration[props.selectedProgressBar];

  return (
    <MuiBox sx={props.sx}>
      <MuiTooltip
        title={currentProgressBarConfiguration.tooltipText}
        followCursor
      >
        <MuiBox
          aria-label={currentProgressBarConfiguration.ariaLabel}
          sx={{
            ...classes.bar,
            background: currentProgressBarConfiguration.background,
          }}
          onClick={currentProgressBarConfiguration.onClickHandler}
        />
      </MuiTooltip>
    </MuiBox>
  );
};
