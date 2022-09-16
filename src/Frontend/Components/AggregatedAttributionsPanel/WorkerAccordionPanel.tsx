// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useContext, useMemo, useState } from 'react';
import {
  AttributionData,
  AttributionIdWithCount,
  Attributions,
} from '../../../shared/shared-types';
import { AccordionPanel } from './AccordionPanel';
import { PackagePanelTitle } from '../../enums/enums';
import {
  AttributionIdsWithCountAndResourceId,
  PanelData,
} from '../../types/types';
import { AccordionWorkersContext } from '../WorkersContextProvider/WorkersContextProvider';

const EMPTY_ATTRIBUTION_IDS_WITH_COUNT_AND_RESOURCE_ID = {
  resourceId: '',
  attributionIdsWithCount: [],
};

type ContainedAttributionsAccordionWorkerArgs =
  | ContainedExternalAttributionsAccordionWorkerArgs
  | ContainedManualAttributionsAccordionWorkerArgs;

interface ContainedExternalAttributionsAccordionWorkerArgs {
  selectedResourceId: string;
  externalData?: AttributionData;
  resolvedExternalAttributions: Set<string>;
}

interface ContainedManualAttributionsAccordionWorkerArgs {
  selectedResourceId: string;
  manualData: AttributionData;
}

interface WorkerAccordionPanelProps {
  title:
    | PackagePanelTitle.ContainedExternalPackages
    | PackagePanelTitle.ContainedManualPackages;
  workerArgs: ContainedAttributionsAccordionWorkerArgs;
  syncFallbackArgs?: ContainedAttributionsAccordionWorkerArgs;
  getAttributionIdsWithCount(
    workerArgs: ContainedAttributionsAccordionWorkerArgs
  ): Array<AttributionIdWithCount>;
  attributions: Attributions;
  isAddToPackageEnabled: boolean;
}

export function WorkerAccordionPanel(
  props: WorkerAccordionPanelProps
): ReactElement {
  const [
    attributionIdsWithCountAndResourceId,
    setAttributionIdsWithCountAndResourceId,
  ] = useState<AttributionIdsWithCountAndResourceId>(
    EMPTY_ATTRIBUTION_IDS_WITH_COUNT_AND_RESOURCE_ID
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
      setAttributionIdsWithCountAndResourceId,
      props.getAttributionIdsWithCount,
      props.syncFallbackArgs
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.syncFallbackArgs, worker, props.workerArgs]);

  let panelData: PanelData;
  if (
    props.workerArgs.selectedResourceId ===
    attributionIdsWithCountAndResourceId.resourceId
  ) {
    panelData = {
      title: props.title,
      attributionIdsWithCount:
        attributionIdsWithCountAndResourceId.attributionIdsWithCount,
      attributions: props.attributions,
    };
  } else {
    panelData = {
      title: props.title,
      attributionIdsWithCount: [],
      attributions: props.attributions,
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
  setAttributionIdsWithCountAndResourceId: (
    attributionIdsWithCountAndResourceId: AttributionIdsWithCountAndResourceId
  ) => void,
  getAttributionIdsWithCount: (
    workerArgs: ContainedAttributionsAccordionWorkerArgs
  ) => Array<AttributionIdWithCount>,
  syncFallbackArgs?: ContainedAttributionsAccordionWorkerArgs
): Promise<void> {
  setAttributionIdsWithCountAndResourceId(
    EMPTY_ATTRIBUTION_IDS_WITH_COUNT_AND_RESOURCE_ID
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
          setAttributionIdsWithCountAndResourceId,
          getAttributionIdsWithCount,
          workerArgs,
          syncFallbackArgs
        );
      } else {
        setAttributionIdsWithCountAndResourceId(output);
      }
    };
  } catch (error) {
    logErrorAndComputeInMainProcess(
      panelTitle,
      error,
      setAttributionIdsWithCountAndResourceId,
      getAttributionIdsWithCount,
      workerArgs,
      syncFallbackArgs
    );
  }
}

function logErrorAndComputeInMainProcess(
  panelTitle: string,
  error: unknown,
  setAttributionIdsWithCountAndResourceId: (
    attributionIdsWithCountAndResourceId: AttributionIdsWithCountAndResourceId
  ) => void,
  getAttributionIdsWithCount: (
    workerArgs: ContainedAttributionsAccordionWorkerArgs
  ) => Array<AttributionIdWithCount>,
  workerArgs: ContainedAttributionsAccordionWorkerArgs,
  syncFallbackArgs?: ContainedAttributionsAccordionWorkerArgs
): void {
  console.info(`Error in ResourceDetailsTab ${panelTitle}: `, error);

  const attributionIdsWithCount = getAttributionIdsWithCount(
    syncFallbackArgs || workerArgs
  );

  setAttributionIdsWithCountAndResourceId({
    resourceId: workerArgs.selectedResourceId,
    attributionIdsWithCount,
  });
}
