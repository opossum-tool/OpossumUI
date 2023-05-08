// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useContext, useMemo, useState } from 'react';
import { AttributionsToHashes } from '../../../shared/shared-types';
import { AccordionPanel } from './AccordionPanel';
import { PackagePanelTitle } from '../../enums/enums';
import {
  DisplayAttributionsWithCountAndResourceId,
  DisplayAttributionWithCount,
  PanelData,
} from '../../types/types';
import { AccordionWorkersContext } from '../WorkersContextProvider/WorkersContextProvider';
import { PanelAttributionData } from '../../util/get-contained-packages';

const EMPTY_DISPLAY_ATTRIBUTIONS_WITH_COUNT_AND_RESOURCE_ID: DisplayAttributionsWithCountAndResourceId =
  {
    resourceId: '',
    displayAttributionsWithCount: [],
  };

type ContainedAttributionsAccordionWorkerArgs =
  | ContainedExternalAttributionsAccordionWorkerArgs
  | ContainedManualAttributionsAccordionWorkerArgs;

interface ContainedExternalAttributionsAccordionWorkerArgs {
  selectedResourceId: string;
  externalData?: PanelAttributionData;
  attributionsToHashes?: AttributionsToHashes;
  resolvedExternalAttributions: Set<string>;
}

interface ContainedManualAttributionsAccordionWorkerArgs {
  selectedResourceId: string;
  manualData: PanelAttributionData;
}

interface WorkerAccordionPanelProps {
  title:
    | PackagePanelTitle.ContainedExternalPackages
    | PackagePanelTitle.ContainedManualPackages;
  workerArgs: ContainedAttributionsAccordionWorkerArgs;
  syncFallbackArgs?: ContainedAttributionsAccordionWorkerArgs;
  getDisplayAttributionsWithCount(
    workerArgs: ContainedAttributionsAccordionWorkerArgs
  ): Array<DisplayAttributionWithCount>;
  isAddToPackageEnabled: boolean;
}

export function WorkerAccordionPanel(
  props: WorkerAccordionPanelProps
): ReactElement {
  const [
    displayAttributionsWithCountAndResourceId,
    setDisplayAttributionsWithCountAndResourceId,
  ] = useState<DisplayAttributionsWithCountAndResourceId>(
    EMPTY_DISPLAY_ATTRIBUTIONS_WITH_COUNT_AND_RESOURCE_ID
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
    loadAttributionIdsWithCount(
      props.workerArgs,
      worker,
      props.title,
      setDisplayAttributionsWithCountAndResourceId,
      props.getDisplayAttributionsWithCount,
      props.syncFallbackArgs
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.syncFallbackArgs, worker, props.workerArgs]);

  let panelData: PanelData;
  if (
    props.workerArgs.selectedResourceId ===
    displayAttributionsWithCountAndResourceId.resourceId
  ) {
    panelData = {
      title: props.title,
      displayAttributionsWithCount:
        displayAttributionsWithCountAndResourceId.displayAttributionsWithCount,
    };
  } else {
    panelData = {
      title: props.title,
      displayAttributionsWithCount: [],
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
async function loadAttributionIdsWithCount(
  workerArgs: ContainedAttributionsAccordionWorkerArgs,
  worker: Worker,
  panelTitle: string,
  setDisplayAttributionsWithCountAndResourceId: (
    attributionIdsWithCountAndResourceId: DisplayAttributionsWithCountAndResourceId
  ) => void,
  getDisplayAttributionsWithCount: (
    workerArgs: ContainedAttributionsAccordionWorkerArgs
  ) => Array<DisplayAttributionWithCount>,
  syncFallbackArgs?: ContainedAttributionsAccordionWorkerArgs
): Promise<void> {
  setDisplayAttributionsWithCountAndResourceId(
    EMPTY_DISPLAY_ATTRIBUTIONS_WITH_COUNT_AND_RESOURCE_ID
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
          setDisplayAttributionsWithCountAndResourceId,
          getDisplayAttributionsWithCount,
          workerArgs,
          syncFallbackArgs
        );
      } else {
        setDisplayAttributionsWithCountAndResourceId(output);
      }
    };
  } catch (error) {
    logErrorAndComputeInMainProcess(
      panelTitle,
      error,
      setDisplayAttributionsWithCountAndResourceId,
      getDisplayAttributionsWithCount,
      workerArgs,
      syncFallbackArgs
    );
  }
}

function logErrorAndComputeInMainProcess(
  panelTitle: string,
  error: unknown,
  setDisplayAttributionsWithCountAndResourceId: (
    attributionIdsWithCountAndResourceId: DisplayAttributionsWithCountAndResourceId
  ) => void,
  getDisplayAttributionsWithCount: (
    workerArgs: ContainedAttributionsAccordionWorkerArgs
  ) => Array<DisplayAttributionWithCount>,
  workerArgs: ContainedAttributionsAccordionWorkerArgs,
  syncFallbackArgs?: ContainedAttributionsAccordionWorkerArgs
): void {
  console.info(`Error in ResourceDetailsTab ${panelTitle}: `, error);

  const displayAttributionIdsWithCount = getDisplayAttributionsWithCount(
    syncFallbackArgs || workerArgs
  );

  setDisplayAttributionsWithCountAndResourceId({
    resourceId: workerArgs.selectedResourceId,
    displayAttributionsWithCount: displayAttributionIdsWithCount,
  });
}
