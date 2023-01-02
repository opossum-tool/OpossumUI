// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiBox from '@mui/material/Box';
import React, { ReactElement, useContext, useMemo, useState } from 'react';
import {
  getAttributionBreakpoints,
  getFilesWithChildren,
  getManualAttributions,
  getResources,
  getResourcesToExternalAttributions,
  getResourcesToManualAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import { ProgressBarData, ProgressBarWorkerArgs } from '../../types/types';
import { useAppSelector } from '../../state/hooks';
import { ProgressBar } from './ProgressBar';
import { ProgressBarWorkersContext } from '../WorkersContextProvider/WorkersContextProvider';
import { getResolvedExternalAttributions } from '../../state/selectors/audit-view-resource-selectors';
import { getUpdatedProgressBarData } from '../../state/helpers/progress-bar-data-helpers';
import { getExternalAttributions } from '../../state/selectors/all-views-resource-selectors';
import { SwitchWithTooltip } from '../SwitchWithTooltip/SwitchWithTooltip';

const classes = {
  root: {
    flex: 1,
    display: 'flex',
    marginLeft: '12px',
    marginRight: '12px',
  },
  switch: {
    margin: 'auto',
  },
};

export function TopProgressBar(): ReactElement {
  const resources = useAppSelector(getResources);
  const manualAttributions = useAppSelector(getManualAttributions);
  const externalAttributions = useAppSelector(getExternalAttributions);
  const resourcesToManualAttributions = useAppSelector(
    getResourcesToManualAttributions
  );
  const resourcesToExternalAttributions = useAppSelector(
    getResourcesToExternalAttributions
  );
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions
  );
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const filesWithChildren = useAppSelector(getFilesWithChildren);

  const [topProgressBarData, setTopProgressBarData] =
    useState<ProgressBarData | null>(null);

  const topProgressBarWorker = useContext(
    ProgressBarWorkersContext
  ).TopProgressBarWorker;

  const topProgressBarWorkerArgs = useMemo(
    () => ({
      resourceId: '/',
      manualAttributions,
      externalAttributions,
      resourcesToManualAttributions,
      resolvedExternalAttributions,
    }),
    [
      manualAttributions,
      externalAttributions,
      resourcesToManualAttributions,
      resolvedExternalAttributions,
    ]
  );

  const topProgressBarSyncFallbackArgs = useMemo(
    () => ({
      resources,
      resourceId: '/',
      manualAttributions,
      externalAttributions,
      resourcesToManualAttributions,
      resourcesToExternalAttributions,
      resolvedExternalAttributions,
      attributionBreakpoints,
      filesWithChildren,
    }),
    [
      resources,
      manualAttributions,
      externalAttributions,
      resourcesToManualAttributions,
      resourcesToExternalAttributions,
      resolvedExternalAttributions,
      attributionBreakpoints,
      filesWithChildren,
    ]
  );

  const [progressBarCriticalityState, setProgressBarCriticalityState] =
    useState<boolean>(false);

  const handleSwitchClick = (): void => {
    setProgressBarCriticalityState(!progressBarCriticalityState);
  };
  const switchToolTipText = progressBarCriticalityState
    ? 'Critical signals progress bar selected'
    : 'Progress bar selected';

  useMemo(() => {
    loadProgressBarData(
      topProgressBarWorker,
      topProgressBarWorkerArgs,
      setTopProgressBarData,
      topProgressBarSyncFallbackArgs
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topProgressBarWorker, topProgressBarWorkerArgs]);
  return topProgressBarData ? (
    <MuiBox sx={classes.root}>
      <ProgressBar
        sx={classes.root}
        progressBarType={'TopProgressBar'}
        progressBarData={topProgressBarData}
        progressBarCriticalityState={progressBarCriticalityState}
      />
      <SwitchWithTooltip
        sx={classes.switch}
        switchToolTipText={switchToolTipText}
        isChecked={progressBarCriticalityState}
        handleSwitchClick={handleSwitchClick}
        ariaLabel="CriticalityStateSwitch"
      />
    </MuiBox>
  ) : (
    <MuiBox sx={classes.root} />
  );

  // eslint-disable-next-line @typescript-eslint/require-await
  async function loadProgressBarData(
    worker: Worker,
    workerArgs: Partial<ProgressBarWorkerArgs>,
    setTopProgressBarData: (progressBarData: ProgressBarData | null) => void,
    syncFallbackArgs: ProgressBarWorkerArgs
  ): Promise<void> {
    try {
      worker.postMessage(workerArgs);

      worker.onmessage = ({ data: { output } }): void => {
        if (!output) {
          logErrorAndComputeInMainProcess(
            Error('Web Worker execution error.'),
            setTopProgressBarData,
            syncFallbackArgs
          );
        } else {
          setTopProgressBarData(output.progressBarData);
        }
      };
    } catch (error) {
      logErrorAndComputeInMainProcess(
        error,
        setTopProgressBarData,
        syncFallbackArgs
      );
    }
  }

  function logErrorAndComputeInMainProcess(
    error: unknown,
    setTopProgressBarData: (topProgressBarData: ProgressBarData | null) => void,
    syncFallbackArgs: ProgressBarWorkerArgs
  ): void {
    console.info('Error in rendering top progress bar: ', error);
    const progressBarData = getUpdatedProgressBarData(syncFallbackArgs);

    setTopProgressBarData(progressBarData);
  }
}
