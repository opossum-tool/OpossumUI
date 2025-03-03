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
  return (
    <MuiBox sx={props.sx}>
      <MuiTooltip
        title={
          props.selectedProgressBar === 'criticality'
            ? getCriticalityBarTooltipText(props.progressBarData)
            : getProgressBarTooltipText(props.progressBarData)
        }
        followCursor
      >
        <MuiBox
          aria-label={
            props.selectedProgressBar === 'criticality'
              ? text.topBar.switchableProgressBar.criticalSignalsBar.ariaLabel
              : text.topBar.switchableProgressBar.attributionProgressBar
                  .ariaLabel
          }
          sx={{
            ...classes.bar,
            background:
              props.selectedProgressBar === 'criticality'
                ? getCriticalityBarBackground(props.progressBarData)
                : getProgressBarBackground(props.progressBarData),
          }}
          onClick={
            props.selectedProgressBar === 'criticality'
              ? onCriticalityBarClick
              : onProgressBarClick
          }
        />
      </MuiTooltip>
    </MuiBox>
  );
};
