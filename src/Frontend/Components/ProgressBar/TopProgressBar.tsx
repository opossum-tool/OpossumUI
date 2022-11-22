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

const classes = {
  root: {
    flex: 1,
    marginLeft: '12px',
    marginRight: '12px',
  },
};

export function TopProgressBar(): ReactElement {
  const resources = useAppSelector(getResources);
  const manualAttributions = useAppSelector(getManualAttributions);
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
      resourcesToManualAttributions,
      resolvedExternalAttributions,
    }),
    [
      manualAttributions,
      resourcesToManualAttributions,
      resolvedExternalAttributions,
    ]
  );

  const topProgressBarSyncFallbackArgs = useMemo(
    () => ({
      resources,
      resourceId: '/',
      manualAttributions,
      resourcesToManualAttributions,
      resourcesToExternalAttributions,
      resolvedExternalAttributions,
      attributionBreakpoints,
      filesWithChildren,
    }),
    [
      resources,
      manualAttributions,
      resourcesToManualAttributions,
      resourcesToExternalAttributions,
      resolvedExternalAttributions,
      attributionBreakpoints,
      filesWithChildren,
    ]
  );

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
    <ProgressBar
      sx={classes.root}
      progressBarType={'TopProgressBar'}
      progressBarData={topProgressBarData}
    />
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
