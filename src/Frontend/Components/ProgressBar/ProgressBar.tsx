// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { keyframes } from '@emotion/react';
import CircleIcon from '@mui/icons-material/Circle';
import type { SxProps } from '@mui/material';
import MuiBox from '@mui/material/Box';
import MuiTooltip from '@mui/material/Tooltip';
import Box from '@mui/system/Box';
import { useRef } from 'react';

import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { navigateToSelectedPathOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getSelectedResourceId } from '../../state/selectors/resource-selectors';
import type { SelectedProgressBar } from '../../types/types';
import { backend } from '../../util/backendClient';
import { useClassifications } from '../../util/use-classifications';
import {
  calculateAttributionBarSteps,
  calculateClassificationBarSteps,
  calculateCriticalityBarSteps,
  createBackgroundFromProgressBarSteps,
  type ProgressBarStep,
} from './ProgressBar.util';

const throbberDotPulsing = keyframes`
  0%, 100% { opacity: 0.25; }
  50% { opacity: 1; }
`;

const throbberDotDelays = ['0s', '0.1s', '0.2s', '0.3s', '0.4s'];

const classes = {
  bar: {
    flex: 1,
    border: `2px solid ${OpossumColors.white}`,
    mt: 0.5,
    height: '20px',
    '&:hover': { cursor: 'pointer', opacity: 0.75 },
    position: 'relative',
  },
  loadingBar: {
    flex: 1,
    border: `2px solid ${OpossumColors.white}`,
    mt: 0.5,
    height: '20px',
    background: OpossumColors.middleBlue,
    position: 'relative',
  },
  throbber: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    pointerEvents: 'none',
  },
  throbberDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: OpossumColors.white,
    animation: `${throbberDotPulsing} 1s infinite`,
  },
};

interface ProgressBarProps {
  sx?: SxProps;
  selectedProgressBar: SelectedProgressBar;
}

interface ProgressBarTooltipProps {
  steps: Array<ProgressBarStep>;
}

type NextResourceRefetch = () => Promise<{
  data: string | null | undefined;
}>;

export const ProgressBar: React.FC<ProgressBarProps> = (props) => {
  const dispatch = useAppDispatch();
  const nextResourceRequestInFlightRef = useRef(false);

  function goToResource(resourcePath: string | null | undefined) {
    if (!resourcePath) {
      return;
    }
    dispatch(navigateToSelectedPathOrOpenUnsavedPopup(resourcePath));
  }

  async function goToNextResource(refetch: NextResourceRefetch) {
    if (nextResourceRequestInFlightRef.current) {
      return;
    }

    nextResourceRequestInFlightRef.current = true;
    try {
      const { data } = await refetch();
      goToResource(data);
    } finally {
      nextResourceRequestInFlightRef.current = false;
    }
  }

  const selectedResourcePath = useAppSelector(getSelectedResourceId);

  const attributionsProgressBarData =
    backend.getAttributionProgressBarData.useQuery(undefined, {
      enabled: props.selectedProgressBar === 'attribution',
    });
  const getNextAttributionResource =
    backend.getNextFileToReviewForAttribution.useQuery(
      { selectedResourcePath },
      { enabled: false },
    );

  const criticalityProgressBarData =
    backend.getCriticalityProgressBarData.useQuery(undefined, {
      enabled: props.selectedProgressBar === 'criticality',
    });
  const getNextCriticalityResource =
    backend.getNextFileToReviewForCriticality.useQuery(
      { selectedResourcePath },
      { enabled: false },
    );

  const classificationProgressBarData =
    backend.getClassificationProgressBarData.useQuery(undefined, {
      enabled: props.selectedProgressBar === 'classification',
    });
  const getNextClassificationResource =
    backend.getNextFileToReviewForClassification.useQuery(
      { selectedResourcePath },
      { enabled: false },
    );
  const classifications = useClassifications();

  const progressBarDataQueries: Record<
    SelectedProgressBar,
    { isPending: boolean; isFetching: boolean }
  > = {
    attribution: attributionsProgressBarData,
    criticality: criticalityProgressBarData,
    classification: classificationProgressBarData,
  };

  const isInitialFetchInProgress =
    progressBarDataQueries[props.selectedProgressBar].isPending;
  const isRefetchInProgress =
    progressBarDataQueries[props.selectedProgressBar].isFetching &&
    !isInitialFetchInProgress;

  const progressBarConfigurations: Record<
    SelectedProgressBar,
    {
      Title: React.FC<ProgressBarTooltipProps>;
      ariaLabel: string;
      steps: Array<ProgressBarStep> | undefined;
      onClickHandler: () => void;
    }
  > = {
    attribution: {
      Title: AttributionBarTooltipTitle,
      ariaLabel: text.topBar.switchableProgressBar.attributionBar.ariaLabel,
      steps: attributionsProgressBarData.data
        ? calculateAttributionBarSteps(attributionsProgressBarData.data)
        : undefined,
      onClickHandler: () => {
        void goToNextResource(() =>
          getNextAttributionResource.refetch({ cancelRefetch: false }),
        );
      },
    },
    criticality: {
      Title: CriticalityBarTooltipTitle,
      ariaLabel: text.topBar.switchableProgressBar.criticalityBar.ariaLabel,
      steps: criticalityProgressBarData.data
        ? calculateCriticalityBarSteps(criticalityProgressBarData.data)
        : undefined,
      onClickHandler: () => {
        void goToNextResource(() =>
          getNextCriticalityResource.refetch({ cancelRefetch: false }),
        );
      },
    },
    classification: {
      Title: ClassificationBarTooltipTitle,
      ariaLabel: text.topBar.switchableProgressBar.classificationBar.ariaLabel,
      steps: classificationProgressBarData.data
        ? calculateClassificationBarSteps(
            classificationProgressBarData.data,
            classifications,
          )
        : undefined,
      onClickHandler: () => {
        void goToNextResource(() =>
          getNextClassificationResource.refetch({ cancelRefetch: false }),
        );
      },
    },
  };

  const { ariaLabel, steps, onClickHandler, Title } =
    progressBarConfigurations[props.selectedProgressBar];

  if (isInitialFetchInProgress) {
    return (
      <MuiBox sx={props.sx}>
        <MuiBox
          aria-busy={true}
          data-testid={'progress-bar-loading'}
          sx={classes.loadingBar}
        >
          <LoadingDotsThrobber />
        </MuiBox>
      </MuiBox>
    );
  }

  if (!steps) {
    return <MuiBox sx={{ flex: 1 }} />;
  }

  return (
    <MuiBox sx={props.sx}>
      <MuiTooltip title={<Title steps={steps} />} followCursor>
        <MuiBox
          aria-busy={isRefetchInProgress ? true : undefined}
          aria-label={ariaLabel}
          data-testid={'progress-bar'}
          sx={{
            ...classes.bar,
            background: createBackgroundFromProgressBarSteps(steps),
          }}
          onClick={onClickHandler}
        >
          {isRefetchInProgress && <LoadingDotsThrobber />}
        </MuiBox>
      </MuiTooltip>
    </MuiBox>
  );
};

const LoadingDotsThrobber: React.FC = () => (
  <MuiBox
    aria-hidden={true}
    data-testid={'progress-bar-throbber'}
    sx={classes.throbber}
  >
    {throbberDotDelays.map((delay) => (
      <MuiBox
        key={delay}
        sx={{ ...classes.throbberDot, animationDelay: delay }}
      />
    ))}
  </MuiBox>
);

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
              gap: 1.25,
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
