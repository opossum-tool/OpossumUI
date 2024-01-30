// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';

import { useAppSelector } from '../state/hooks';
import {
  getAttributionBreakpoints,
  getExternalAttributionSources,
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
import {
  useAttributionSorting,
  useSignalSorting,
} from '../state/variables/use-active-sorting';
import { useAutocompleteSignals } from '../state/variables/use-autocomplete-signals';
import { useFilteredAttributions } from '../state/variables/use-filtered-attributions';
import { useFolderProgressData } from '../state/variables/use-folder-progress-data';
import { useOverallProgressData } from '../state/variables/use-overall-progress-data';
import { usePanelData } from '../state/variables/use-panel-data';
import { shouldNotBeCalled } from '../util/should-not-be-called';
import { SignalsWorkerInput, SignalsWorkerOutput } from './signals-worker';

export function useSignalsWorker() {
  const resourceId = useAppSelector(getSelectedResourceId);
  const externalData = useAppSelector(getExternalData);
  const manualData = useAppSelector(getManualData);
  const sources = useAppSelector(getExternalAttributionSources);
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions,
  );
  const resources = useAppSelector(getResources);
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const isAuditView = useAppSelector(isAuditViewSelected);
  const { projectId } = useAppSelector(getProjectMetadata);
  const [worker, setWorker] = useState<Worker>();

  const { signalSorting } = useSignalSorting();
  const { attributionSorting } = useAttributionSorting();
  const [{ selectedFilters, search }, setFilteredAttributions] =
    useFilteredAttributions();
  const [, setAutocompleteSignals] = useAutocompleteSignals();
  const [, setPanelData] = usePanelData();
  const [, setOverallProgressData] = useOverallProgressData();
  const [, setFolderProgressData] = useFolderProgressData();

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
          case 'filteredAttributionCounts':
            setFilteredAttributions((prev) => ({
              ...prev,
              counts: data.data,
            }));
            break;
          case 'filteredAttributions':
            setFilteredAttributions((prev) => ({
              ...prev,
              loading: false,
              attributions: data.data,
            }));
            break;
          default:
            shouldNotBeCalled(data);
        }
      };
    }
  }, [
    setAutocompleteSignals,
    setFilteredAttributions,
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
        attributionsToResources: externalData.attributionsToResources,
      },
    } satisfies SignalsWorkerInput);
  }, [externalData, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'manualData',
      data: manualData,
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
      name: 'signalSorting',
      data: signalSorting,
    } satisfies SignalsWorkerInput);
  }, [signalSorting, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'attributionSorting',
      data: attributionSorting,
    } satisfies SignalsWorkerInput);
  }, [attributionSorting, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'selectedFilters',
      data: selectedFilters,
    } satisfies SignalsWorkerInput);

    setFilteredAttributions((prev) => ({
      ...prev,
      loading: true,
    }));
  }, [selectedFilters, setFilteredAttributions, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'attributionSearch',
      data: search,
    } satisfies SignalsWorkerInput);

    setFilteredAttributions((prev) => ({
      ...prev,
      loading: true,
    }));
  }, [search, setFilteredAttributions, worker]);
}
