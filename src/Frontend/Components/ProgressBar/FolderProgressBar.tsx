// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiSkeleton from '@mui/material/Skeleton';
import React, { ReactElement, useContext, useMemo, useState } from 'react';
import {
  getAttributionBreakpoints,
  getFilesWithChildren,
  getManualAttributions,
  getResources,
  getResourcesToExternalAttributions,
  getResourcesToManualAttributions,
} from '../../state/selectors/all-views-resource-selectors';
import {
  ProgressBarDataAndResourceId,
  ProgressBarData,
  ProgressBarWorkerArgs,
} from '../../types/types';
import { useAppSelector } from '../../state/hooks';
import { getResolvedExternalAttributions } from '../../state/selectors/audit-view-resource-selectors';
import { ProgressBarWorkersContext } from '../WorkersContextProvider/WorkersContextProvider';
import { getUpdatedProgressBarData } from '../../state/helpers/progress-bar-data-helpers';
import { ProgressBar } from './ProgressBar';

const classes = {
  root: {
    flex: 0,
  },
};

const EMPTY_FOLDER_PROGRESS_BAR_AND_RESOURCE_ID = {
  progressBarData: null,
  resourceId: '',
};

interface FolderProgressBarProps {
  resourceId: string;
}

export function FolderProgressBar(props: FolderProgressBarProps): ReactElement {
  const resourceId = props.resourceId;

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

  const [
    folderProgressBarDataAndResourceId,
    setFolderProgressBarDataAndResourceId,
  ] = useState<ProgressBarDataAndResourceId>(
    EMPTY_FOLDER_PROGRESS_BAR_AND_RESOURCE_ID
  );

  const folderProgressBarWorker = useContext(
    ProgressBarWorkersContext
  ).FolderProgressBarWorker;

  const folderProgressBarWorkerArgs = useMemo(
    () => ({
      resourceId,
      manualAttributions,
      resourcesToManualAttributions,
      resolvedExternalAttributions,
    }),
    [
      resourceId,
      manualAttributions,
      resourcesToManualAttributions,
      resolvedExternalAttributions,
    ]
  );

  const folderProgressBarSyncFallbackArgs = useMemo(
    () => ({
      resources,
      resourceId,
      manualAttributions,
      resourcesToManualAttributions,
      resourcesToExternalAttributions,
      resolvedExternalAttributions,
      attributionBreakpoints,
      filesWithChildren,
    }),
    [
      resources,
      resourceId,
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
      folderProgressBarWorker,
      folderProgressBarWorkerArgs,
      setFolderProgressBarDataAndResourceId,
      folderProgressBarSyncFallbackArgs
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderProgressBarWorker, folderProgressBarWorkerArgs]);

  let displayedProgressBarData: ProgressBarData | null;
  if (
    folderProgressBarWorkerArgs.resourceId ===
    folderProgressBarDataAndResourceId.resourceId
  ) {
    displayedProgressBarData =
      folderProgressBarDataAndResourceId.progressBarData;
  } else {
    displayedProgressBarData = null;
  }

  return displayedProgressBarData ? (
    <ProgressBar
      sx={classes.root}
      progressBarType={'FolderProgressBar'}
      progressBarData={displayedProgressBarData}
    />
  ) : (
    <MuiSkeleton height={20} />
  );
}

// eslint-disable-next-line @typescript-eslint/require-await
async function loadProgressBarData(
  worker: Worker,
  workerArgs: Partial<ProgressBarWorkerArgs>,
  setFolderProgressBarDataAndResourceId: (
    folderProgressBarDataAndResourceId: ProgressBarDataAndResourceId
  ) => void,
  syncFallbackArgs: ProgressBarWorkerArgs
): Promise<void> {
  setFolderProgressBarDataAndResourceId(
    EMPTY_FOLDER_PROGRESS_BAR_AND_RESOURCE_ID
  );

  try {
    worker.postMessage(workerArgs);

    worker.onmessage = ({ data: { output } }): void => {
      if (!output) {
        logErrorAndComputeInMainProcess(
          Error('Web Worker execution error.'),
          setFolderProgressBarDataAndResourceId,
          syncFallbackArgs
        );
      } else {
        setFolderProgressBarDataAndResourceId(output);
      }
    };
  } catch (error) {
    logErrorAndComputeInMainProcess(
      error,
      setFolderProgressBarDataAndResourceId,
      syncFallbackArgs
    );
  }
}

function logErrorAndComputeInMainProcess(
  error: unknown,
  setFolderProgressBarDataAndResourceId: (
    folderProgressBarDataAndResourceId: ProgressBarDataAndResourceId
  ) => void,
  syncFallbackArgs: ProgressBarWorkerArgs
): void {
  console.info('Error in rendering folder progress bar: ', error);
  const progressBarData = getUpdatedProgressBarData(syncFallbackArgs);
  setFolderProgressBarDataAndResourceId({
    progressBarData,
    resourceId: syncFallbackArgs.resourceId,
  });
}
