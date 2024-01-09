// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';

import { AutocompleteSignal } from '../../shared/shared-types';
import { text } from '../../shared/text';
import { useAppSelector } from '../state/hooks';
import {
  getAttributionBreakpoints,
  getExternalAttributionSources,
  getExternalAttributionsToHashes,
  getExternalData,
  getFilesWithChildren,
  getManualData,
  getProjectMetadata,
  getResources,
} from '../state/selectors/all-views-resource-selectors';
import {
  getResolvedExternalAttributions,
  getSelectedResourceId,
} from '../state/selectors/audit-view-resource-selectors';
import { isAuditViewSelected } from '../state/selectors/view-selector';
import { PanelData, ProgressBarData } from '../types/types';
import { shouldNotBeCalled } from '../util/should-not-be-called';
import { useActiveSortingInAuditView } from '../util/use-active-sorting';
import { useVariable } from '../util/use-variable';
import { SignalsWorkerInput, SignalsWorkerOutput } from './signals-worker';

export enum WORKER_REDUX_KEYS {
  AUTOCOMPLETE_SIGNALS = 'autocomplete-signals',
  PANEL_DATA = 'panel-data',
  OVERALL_PROGRESS_DATA = 'overall-progress-data',
  FOLDER_PROGRESS_DATA = 'folder-progress-data',
}

interface WorkerPanelData {
  attributionsInFolderContent: PanelData;
  signalsInFolderContent: PanelData;
}

const initialWorkerPanelData: WorkerPanelData = {
  attributionsInFolderContent: {
    sortedPackageCardIds: [],
    displayPackageInfosWithCount: {},
  },
  signalsInFolderContent: {
    sortedPackageCardIds: [],
    displayPackageInfosWithCount: {},
  },
};

export function useAutocompleteSignals() {
  const [autocompleteSignals] = useVariable<Array<AutocompleteSignal>>(
    WORKER_REDUX_KEYS.AUTOCOMPLETE_SIGNALS,
    [],
  );

  return autocompleteSignals;
}

export function usePanelData() {
  const [panelData] = useVariable<WorkerPanelData>(
    WORKER_REDUX_KEYS.PANEL_DATA,
    initialWorkerPanelData,
  );

  return panelData;
}

export function useOverallProgressData() {
  const [overallProgressData] = useVariable<ProgressBarData | null>(
    WORKER_REDUX_KEYS.OVERALL_PROGRESS_DATA,
    null,
  );

  return overallProgressData;
}

export function useFolderProgressData() {
  const [folderProgressData] = useVariable<ProgressBarData | null>(
    WORKER_REDUX_KEYS.FOLDER_PROGRESS_DATA,
    null,
  );

  return folderProgressData;
}

export function useSignalsWorker() {
  const resourceId = useAppSelector(getSelectedResourceId);
  const externalData = useAppSelector(getExternalData);
  const manualData = useAppSelector(getManualData);
  const sources = useAppSelector(getExternalAttributionSources);
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions,
  );
  const attributionsToHashes = useAppSelector(getExternalAttributionsToHashes);
  const resources = useAppSelector(getResources);
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const isAuditView = useAppSelector(isAuditViewSelected);
  const { projectId } = useAppSelector(getProjectMetadata);
  const [activeSorting] = useActiveSortingInAuditView();

  const [worker, setWorker] = useState<Worker>();
  const [, setAutocompleteSignals] = useVariable<Array<AutocompleteSignal>>(
    WORKER_REDUX_KEYS.AUTOCOMPLETE_SIGNALS,
    [],
  );
  const [, setPanelData] = useVariable<WorkerPanelData>(
    WORKER_REDUX_KEYS.PANEL_DATA,
    initialWorkerPanelData,
  );
  const [, setOverallProgressData] = useVariable<ProgressBarData | null>(
    WORKER_REDUX_KEYS.OVERALL_PROGRESS_DATA,
    null,
  );
  const [, setFolderProgressData] = useVariable<ProgressBarData | null>(
    WORKER_REDUX_KEYS.FOLDER_PROGRESS_DATA,
    null,
  );

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const newWorker = new Worker(
      new URL('./signals-worker.ts', import.meta.url),
      { type: 'module' },
    );
    setWorker(newWorker);

    return () => {
      newWorker.terminate();
    };
  }, [projectId]);

  useEffect(() => {
    if (worker) {
      worker.onmessage = ({ data }: MessageEvent<SignalsWorkerOutput>) => {
        switch (data.name) {
          case 'autocompleteSignals':
            setAutocompleteSignals(data.data);
            break;
          case 'attributionsInFolderContent':
            setPanelData((panelData) => ({
              ...panelData,
              attributionsInFolderContent: data.data,
            }));
            break;
          case 'signalsInFolderContent':
            setPanelData((panelData) => ({
              ...panelData,
              signalsInFolderContent: data.data,
            }));
            break;
          case 'overallProgressData':
            setOverallProgressData(data.data);
            break;
          case 'folderProgressData':
            setFolderProgressData(data.data);
            break;
          default:
            shouldNotBeCalled(data);
        }
      };
    }
  }, [
    setAutocompleteSignals,
    setFolderProgressData,
    setOverallProgressData,
    setPanelData,
    worker,
  ]);

  useEffect(() => {
    if (isAuditView && resourceId) {
      worker?.postMessage({
        name: 'resourceId',
        data: resourceId,
      } satisfies SignalsWorkerInput);
    }
  }, [isAuditView, resourceId, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'externalData',
      data: {
        attributions: externalData.attributions,
        resourcesWithAttributedChildren:
          externalData.resourcesWithAttributedChildren,
        resourcesToAttributions: externalData.resourcesToAttributions,
      },
    } satisfies SignalsWorkerInput);
  }, [externalData, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'manualData',
      data: {
        attributions: manualData.attributions,
        resourcesWithAttributedChildren:
          manualData.resourcesWithAttributedChildren,
        resourcesToAttributions: manualData.resourcesToAttributions,
      },
    } satisfies SignalsWorkerInput);
  }, [manualData, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'resolvedExternalAttributions',
      data: resolvedExternalAttributions,
    } satisfies SignalsWorkerInput);
  }, [resolvedExternalAttributions, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'sources',
      data: sources,
    } satisfies SignalsWorkerInput);
  }, [sources, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'attributionsToHashes',
      data: attributionsToHashes,
    } satisfies SignalsWorkerInput);
  }, [attributionsToHashes, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'attributionBreakpoints',
      data: attributionBreakpoints,
    } satisfies SignalsWorkerInput);
  }, [attributionBreakpoints, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'filesWithChildren',
      data: filesWithChildren,
    } satisfies SignalsWorkerInput);
  }, [filesWithChildren, worker]);

  useEffect(() => {
    if (resources) {
      worker?.postMessage({
        name: 'resources',
        data: resources,
      } satisfies SignalsWorkerInput);
    }
  }, [resources, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'sortByCriticality',
      data: activeSorting === text.auditViewSorting.byCriticality,
    } satisfies SignalsWorkerInput);
  }, [activeSorting, worker]);
}
