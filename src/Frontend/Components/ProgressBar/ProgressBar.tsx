// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CircleIcon from '@mui/icons-material/Circle';
import { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiTooltip from '@mui/material/Tooltip';
import Box from '@mui/system/Box';

import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { useAppSelector } from '../../state/hooks';
import { getClassifications } from '../../state/selectors/resource-selectors';
import { ProgressBarData, SelectedProgressBar } from '../../types/types';
import { backend } from '../../util/backendClient';
import {
  calculateAttributionBarSteps,
  calculateClassificationBarSteps,
  calculateCriticalityBarSteps,
  createBackgroundFromProgressBarSteps,
  ProgressBarStep,
  useOnProgressBarClick,
} from './ProgressBar.util';

const classes = {
  bar: {
    flex: 1,
    border: `2px solid ${OpossumColors.white}`,
    marginTop: '2px',
    height: '20px',
    '&:hover': { cursor: 'pointer', opacity: 0.75 },
  },
};

interface ProgressBarProps {
  sx?: SxProps;
  progressBarData: ProgressBarData;
  selectedProgressBar: SelectedProgressBar;
}

interface ProgressBarTooltipProps {
  steps: Array<ProgressBarStep>;
}

export const ProgressBar: React.FC<ProgressBarProps> = (props) => {
  const onAttributionBarClick = useOnProgressBarClick(
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

  let filesToForwardToForCriticality =
    props.progressBarData.resourcesWithNonInheritedExternalAttributionOnly;
  const recordWithHighestClassification = Object.values(
    props.progressBarData.classificationStatistics,
  )
    .reverse()
    .filter((entry) => entry.correspondingFiles.length > 0)[0];
  if (recordWithHighestClassification) {
    filesToForwardToForCriticality =
      recordWithHighestClassification.correspondingFiles;
  }
  const onClassificationBarClick = useOnProgressBarClick(
    filesToForwardToForCriticality,
  );

  const fileWithAttributionsCounts =
    backend.getFileWithAttributionsCounts.useQuery(undefined, {
      enabled: props.selectedProgressBar === 'attribution',
    });

  const fileWithCriticalAttributionsCounts =
    backend.getFileWithCriticalAttributionsCounts.useQuery(undefined, {
      enabled: props.selectedProgressBar === 'criticality',
    });

  const classifications = useAppSelector(getClassifications);
  const fileWithClassifications = backend.getFileClassifications.useQuery(
    {
      classifications,
    },
    { enabled: props.selectedProgressBar === 'classification' },
  );

  interface ProgressBarConfiguration {
    Title: React.FC<ProgressBarTooltipProps>;
    ariaLabel: string;
    steps: Array<ProgressBarStep>;
    onClickHandler: () => void;
  }
  function getProgressBarConfiguration(
    selectedProgressBar: SelectedProgressBar,
  ): ProgressBarConfiguration {
    switch (selectedProgressBar) {
      case 'attribution':
        return {
          Title: AttributionBarTooltipTitle,
          ariaLabel: text.topBar.switchableProgressBar.attributionBar.ariaLabel,
          steps: calculateAttributionBarSteps(fileWithAttributionsCounts.data),
          onClickHandler: onAttributionBarClick,
        };
      case 'criticality':
        return {
          Title: CriticalityBarTooltipTitle,
          ariaLabel: text.topBar.switchableProgressBar.criticalityBar.ariaLabel,
          steps: calculateCriticalityBarSteps(
            fileWithCriticalAttributionsCounts.data,
          ),
          onClickHandler: onCriticalityBarClick,
        };
      case 'classification':
        return {
          Title: ClassificationBarTooltipTitle,
          ariaLabel:
            text.topBar.switchableProgressBar.classificationBar.ariaLabel,
          steps: calculateClassificationBarSteps(fileWithClassifications.data),
          onClickHandler: onClassificationBarClick,
        };
    }
  }

  const { Title, ariaLabel, steps, onClickHandler } =
    getProgressBarConfiguration(props.selectedProgressBar);

  return (
    <MuiBox sx={props.sx}>
      <MuiTooltip title={<Title steps={steps} />} followCursor>
        <MuiBox
          aria-label={ariaLabel}
          sx={{
            ...classes.bar,
            background: createBackgroundFromProgressBarSteps(steps),
          }}
          onClick={onClickHandler}
        />
      </MuiTooltip>
    </MuiBox>
  );
};

const ProgressBarTooltipTitle: React.FC<{
  intro: string;
  steps: Array<ProgressBarStep>;
}> = ({ intro, steps }) => {
  return (
    <MuiBox>
      {`${intro}…`}
      {steps
        .filter((entry) => !!entry.count && !!entry.description)
        .map((entry) => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap',
            }}
            key={entry.description}
          >
            <>
              <CircleIcon fontSize={'inherit'} sx={{ color: entry.color }} />
              {`…${entry.description}: ${new Intl.NumberFormat().format(entry.count ?? 0)}`}
            </>
          </Box>
        ))}
    </MuiBox>
  );
};

const AttributionBarTooltipTitle: React.FC<ProgressBarTooltipProps> = ({
  steps,
}) => {
  return (
    <ProgressBarTooltipTitle
      intro={text.topBar.switchableProgressBar.attributionBar.intro}
      steps={steps}
    />
  );
};

const CriticalityBarTooltipTitle: React.FC<ProgressBarTooltipProps> = ({
  steps,
}) => {
  return (
    <ProgressBarTooltipTitle
      intro={text.topBar.switchableProgressBar.criticalityBar.intro}
      steps={steps}
    />
  );
};

const ClassificationBarTooltipTitle: React.FC<ProgressBarTooltipProps> = ({
  steps,
}) => {
  return (
    <ProgressBarTooltipTitle
      intro={text.topBar.switchableProgressBar.classificationBar.intro}
      steps={steps}
    />
  );
};
