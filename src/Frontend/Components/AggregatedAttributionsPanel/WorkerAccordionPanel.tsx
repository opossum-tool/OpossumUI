// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useMemo, useState } from 'react';
import {
  AttributionIdWithCount,
  Attributions,
} from '../../../shared/shared-types';
import { AccordionPanel } from './AccordionPanel';
import { PackagePanelTitle } from '../../enums/enums';
import { PanelData } from '../../types/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface WorkerAccordionPanelProps {
  title: PackagePanelTitle;
  workerArgs: any;
  syncFallbackArgs?: any;
  getAttributionIdsWithCount(workerArgs: any): Array<AttributionIdWithCount>;
  attributions: Attributions;
  worker: Worker;
  isAddToPackageEnabled: boolean;
}

export function WorkerAccordionPanel(
  props: WorkerAccordionPanelProps
): ReactElement {
  const [attributionIdsWithCount, setAttributionIdsWithCount] = useState<
    Array<AttributionIdWithCount>
  >([]);

  useMemo(() => {
    let active = true;
    setAttributionIdsWithCount([]);

    loadAttributionIdsWithCount(
      props.workerArgs,
      props.worker,
      active,
      props.title,
      setAttributionIdsWithCount,
      props.getAttributionIdsWithCount,
      props.syncFallbackArgs
    );

    return (): void => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.workerArgs,
    props.worker,
    props.getAttributionIdsWithCount,
    props.attributions,
    props.title,
  ]);

  const panelData: PanelData = {
    title: props.title,
    attributionIdsWithCount,
    attributions: props.attributions,
  };

  return (
    <AccordionPanel
      panelData={panelData}
      isAddToPackageEnabled={props.isAddToPackageEnabled}
    />
  );
}

// eslint-disable-next-line @typescript-eslint/require-await
async function loadAttributionIdsWithCount(
  workerArgs: any,
  worker: Worker,
  active: boolean,
  panelTitle: string,
  setAttributionIdsWithCount: (
    AttributionIdsWithCount: Array<AttributionIdWithCount>
  ) => void,
  getAttributionIdsWithCount: (
    workerArgs: any
  ) => Array<AttributionIdWithCount>,
  syncFallbackArgs?: any
): Promise<void> {
  // WebWorkers can fail for different reasons, e.g. because they run out
  // of memory with huge input files or because Jest does not support
  // them. When they fail the accordion is calculated on main. The error
  // message is logged in the console.
  try {
    worker.postMessage(workerArgs);

    if (!active) {
      return;
    }

    worker.onmessage = ({ data: { output } }): void => {
      if (!output) {
        logErrorAndComputeInMainProcess(
          active,
          panelTitle,
          Error('Web Worker execution error.'),
          setAttributionIdsWithCount,
          getAttributionIdsWithCount,
          workerArgs,
          syncFallbackArgs
        );
      } else {
        setAttributionIdsWithCount(output);
      }
    };
  } catch (error) {
    logErrorAndComputeInMainProcess(
      active,
      panelTitle,
      error,
      setAttributionIdsWithCount,
      getAttributionIdsWithCount,
      workerArgs,
      syncFallbackArgs
    );
  }
}

function logErrorAndComputeInMainProcess(
  active: boolean,
  panelTitle: string,
  error: unknown,
  setAttributionIdsWithCount: (
    AttributionIdsWithCount: Array<AttributionIdWithCount>
  ) => void,
  getAttributionIdsWithCount: (
    workerArgs: any
  ) => Array<AttributionIdWithCount>,
  workerArgs: any,
  syncFallbackArgs?: any
): void {
  console.log(`Error in ResourceDetailsTab ${panelTitle}: `, error);

  const output = getAttributionIdsWithCount(syncFallbackArgs || workerArgs);

  if (!active) {
    return;
  }

  setAttributionIdsWithCount(output);
}
