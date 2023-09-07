// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useContext, useMemo, useState } from 'react';
import { AttributionsToHashes } from '../../../shared/shared-types';
import { AccordionPanel } from './AccordionPanel';
import { PackagePanelTitle } from '../../enums/enums';
import {
  DisplayPackageInfosWithCount,
  DisplayPackageInfosWithCountAndResourceId,
  PanelData,
} from '../../types/types';
import { AccordionWorkersContext } from '../WorkersContextProvider/WorkersContextProvider';
import { PanelAttributionData } from '../../util/get-contained-packages';

const EMPTY_DISPLAY_PACKAGE_INFOS_WITH_COUNT_AND_RESOURCE_ID: DisplayPackageInfosWithCountAndResourceId =
  {
    resourceId: '',
    sortedPackageCardIds: [],
    displayPackageInfosWithCount: {},
  };

type ContainedAttributionsAccordionWorkerArgs =
  | ContainedExternalAttributionsAccordionWorkerArgs
  | ContainedManualAttributionsAccordionWorkerArgs;

interface ContainedExternalAttributionsAccordionWorkerArgs {
  selectedResourceId: string;
  externalData?: PanelAttributionData;
  attributionsToHashes?: AttributionsToHashes;
  resolvedExternalAttributions: Set<string>;
  panelTitle: PackagePanelTitle;
}

interface ContainedManualAttributionsAccordionWorkerArgs {
  selectedResourceId: string;
  manualData?: PanelAttributionData;
  panelTitle: PackagePanelTitle;
}

interface WorkerAccordionPanelProps {
  title:
    | PackagePanelTitle.ContainedExternalPackages
    | PackagePanelTitle.ContainedManualPackages;
  workerArgs: ContainedAttributionsAccordionWorkerArgs;
  syncFallbackArgs: ContainedAttributionsAccordionWorkerArgs;
  getDisplayPackageInfosWithCount(
    workerArgs: ContainedAttributionsAccordionWorkerArgs,
  ): [Array<string>, DisplayPackageInfosWithCount];
  isAddToPackageEnabled: boolean;
}

export function WorkerAccordionPanel(
  props: WorkerAccordionPanelProps,
): ReactElement {
  const [
    displayPackageInfosWithCountAndResourceId,
    setDisplayPackageInfosWithCountAndResourceId,
  ] = useState<DisplayPackageInfosWithCountAndResourceId>(
    EMPTY_DISPLAY_PACKAGE_INFOS_WITH_COUNT_AND_RESOURCE_ID,
  );
  const resourceDetailsTabsWorkers = useContext(AccordionWorkersContext);

  let worker: Worker;
  switch (props.title) {
    case PackagePanelTitle.ContainedExternalPackages:
      worker =
        resourceDetailsTabsWorkers.containedExternalAttributionsAccordionWorker;
      break;
    case PackagePanelTitle.ContainedManualPackages:
      worker =
        resourceDetailsTabsWorkers.containedManualAttributionsAccordionWorker;
      break;
  }

  useMemo(() => {
    loadDisplayPackageInfosWithCount(
      props.workerArgs,
      worker,
      props.title,
      setDisplayPackageInfosWithCountAndResourceId,
      props.getDisplayPackageInfosWithCount,
      props.syncFallbackArgs,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.syncFallbackArgs, worker, props.workerArgs]);

  let panelData: PanelData;
  if (
    props.workerArgs.selectedResourceId ===
    displayPackageInfosWithCountAndResourceId.resourceId
  ) {
    panelData = {
      title: props.title,
      sortedPackageCardIds:
        displayPackageInfosWithCountAndResourceId.sortedPackageCardIds,
      displayPackageInfosWithCount:
        displayPackageInfosWithCountAndResourceId.displayPackageInfosWithCount,
    };
  } else {
    panelData = {
      title: props.title,
      sortedPackageCardIds: [],
      displayPackageInfosWithCount: {},
    };
  }

  return (
    <AccordionPanel
      panelData={panelData}
      isAddToPackageEnabled={props.isAddToPackageEnabled}
    />
  );
}

// eslint-disable-next-line @typescript-eslint/require-await
async function loadDisplayPackageInfosWithCount(
  workerArgs: ContainedAttributionsAccordionWorkerArgs,
  worker: Worker,
  panelTitle: string,
  setDisplayPackageInfosWithCountAndResourceId: (
    displayPackageInfosWithCountAndResourceId: DisplayPackageInfosWithCountAndResourceId,
  ) => void,
  getDisplayPackageInfosWithCount: (
    workerArgs: ContainedAttributionsAccordionWorkerArgs,
  ) => [Array<string>, DisplayPackageInfosWithCount],
  syncFallbackArgs: ContainedAttributionsAccordionWorkerArgs,
): Promise<void> {
  setDisplayPackageInfosWithCountAndResourceId(
    EMPTY_DISPLAY_PACKAGE_INFOS_WITH_COUNT_AND_RESOURCE_ID,
  );

  // WebWorkers can fail for different reasons, e.g. because they run out
  // of memory with huge input files or because Jest does not support
  // them. When they fail the accordion is calculated on main. The error
  // message is logged in the console.
  try {
    worker.postMessage(workerArgs);

    worker.onmessage = ({ data: { output } }): void => {
      if (!output) {
        logErrorAndComputeInMainProcess(
          panelTitle,
          Error('Web Worker execution error.'),
          setDisplayPackageInfosWithCountAndResourceId,
          getDisplayPackageInfosWithCount,
          syncFallbackArgs,
        );
      } else {
        setDisplayPackageInfosWithCountAndResourceId(output);
      }
    };
  } catch (error) {
    logErrorAndComputeInMainProcess(
      panelTitle,
      error,
      setDisplayPackageInfosWithCountAndResourceId,
      getDisplayPackageInfosWithCount,
      syncFallbackArgs,
    );
  }
}

function logErrorAndComputeInMainProcess(
  panelTitle: string,
  error: unknown,
  setDisplayPackageInfosWithCountAndResourceId: (
    displayPackageInfosWithCountAndResourceId: DisplayPackageInfosWithCountAndResourceId,
  ) => void,
  getDisplayPackageInfosWithCount: (
    syncFallbackArgs: ContainedAttributionsAccordionWorkerArgs,
  ) => [Array<string>, DisplayPackageInfosWithCount],
  syncFallbackArgs: ContainedAttributionsAccordionWorkerArgs,
): void {
  console.info(`Error in ResourceDetailsTab ${panelTitle}: `, error);

  const [sortedPackageCardIds, displayAttributionIdsWithCount] =
    getDisplayPackageInfosWithCount(syncFallbackArgs);

  setDisplayPackageInfosWithCountAndResourceId({
    resourceId: syncFallbackArgs.selectedResourceId,
    sortedPackageCardIds,
    displayPackageInfosWithCount: displayAttributionIdsWithCount,
  });
}
