// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';

import { EMPTY_DISPLAY_PACKAGE_INFO } from '../shared-constants';
import { changeSelectedAttributionOrOpenUnsavedPopup } from '../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import {
  getAttributionBreakpoints,
  getExternalData,
  getFilesWithChildren,
  getManualData,
  getProjectMetadata,
  getResolvedExternalAttributions,
  getResources,
  getSelectedResourceId,
} from '../state/selectors/resource-selectors';
import { useAreHiddenSignalsVisible } from '../state/variables/use-are-hidden-signals-visible';
import {
  useFilteredAttributions,
  useFilteredAttributionsInReportView,
  useFilteredSignals,
} from '../state/variables/use-filtered-data';
import { useProgressData } from '../state/variables/use-progress-data';
import { useDebouncedInput } from '../util/use-debounced-input';
import { SignalsWorkerInput, SignalsWorkerOutput } from './signals-worker';

export function useSignalsWorker() {
  const dispatch = useAppDispatch();
  const resourceId = useAppSelector(getSelectedResourceId);
  const externalData = useAppSelector(getExternalData);
  const manualData = useAppSelector(getManualData);
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions,
  );
  const resources = useAppSelector(getResources);
  const attributionBreakpoints = useAppSelector(getAttributionBreakpoints);
  const filesWithChildren = useAppSelector(getFilesWithChildren);
  const { projectId } = useAppSelector(getProjectMetadata);
  const [worker, setWorker] = useState<Worker>();

  const [
    {
      sorting: signalSorting,
      filters: signalFilters,
      search: signalSearch,
      selectedLicense: signalSelectedLicense,
    },
    setFilteredSignals,
  ] = useFilteredSignals();
  const [
    {
      sorting: attributionSorting,
      filters: attributionFilters,
      search: attributionSearch,
      selectedLicense: attributionSelectedLicense,
    },
    setFilteredAttributions,
  ] = useFilteredAttributions();
  const [
    {
      filters: reportViewAttributionFilters,
      selectedLicense: reportViewSelectedLicense,
    },
    setFilteredAttributionsInReportView,
  ] = useFilteredAttributionsInReportView();
  const debouncedSignalSearch = useDebouncedInput(signalSearch);
  const debouncedAttributionSearch = useDebouncedInput(attributionSearch);
  const [areHiddenSignalsVisible] = useAreHiddenSignalsVisible();
  const [, setProgressData] = useProgressData();

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
          case 'progressData':
            setProgressData(data.data);
            break;
          case 'filteredAttributionCounts':
            setFilteredAttributions((prev) => ({
              ...prev,
              counts: data.data,
            }));
            break;
          case 'filteredAttributions':
            setFilteredAttributions((prev) => {
              if (prev.selectFirstAttribution) {
                dispatch(
                  changeSelectedAttributionOrOpenUnsavedPopup(
                    Object.values(data.data).find(
                      ({ relation }) =>
                        relation === 'resource' || relation === 'parents',
                    ) || EMPTY_DISPLAY_PACKAGE_INFO,
                  ),
                );
              }
              return {
                ...prev,
                loading: false,
                attributions: data.data,
                selectFirstAttribution: false,
              };
            });
            break;
          case 'reportViewFilteredAttributionCounts':
            setFilteredAttributionsInReportView((prev) => ({
              ...prev,
              counts: data.data,
            }));
            break;
          case 'filteredAttributionsInReportView':
            setFilteredAttributionsInReportView((prev) => ({
              ...prev,
              loading: false,
              attributions: data.data,
            }));
            break;
          case 'filteredSignalCounts':
            setFilteredSignals((prev) => ({
              ...prev,
              counts: data.data,
            }));
            break;
          case 'filteredSignals':
            setFilteredSignals((prev) => ({
              ...prev,
              loading: false,
              attributions: data.data,
            }));
            break;
          case 'filteredAttributionsLoading':
            setFilteredAttributions((prev) => ({
              ...prev,
              loading: data.data,
            }));
            break;
          case 'filteredAttributionsInReportViewLoading':
            setFilteredAttributionsInReportView((prev) => ({
              ...prev,
              loading: data.data,
            }));
            break;
          case 'filteredSignalsLoading':
            setFilteredSignals((prev) => ({
              ...prev,
              loading: data.data,
            }));
            break;
        }
      };
    }
  }, [
    dispatch,
    setFilteredAttributions,
    setFilteredAttributionsInReportView,
    setFilteredSignals,
    setProgressData,
    worker,
  ]);

  useEffect(() => {
    worker?.postMessage({
      name: 'resourceId',
      data: resourceId,
    } satisfies SignalsWorkerInput);
  }, [resourceId, worker]);

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
      name: 'attributionSorting',
      data: attributionSorting,
    } satisfies SignalsWorkerInput);
  }, [attributionSorting, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'attributionFilters',
      data: attributionFilters,
    } satisfies SignalsWorkerInput);
  }, [attributionFilters, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'reportViewAttributionFilters',
      data: reportViewAttributionFilters,
    } satisfies SignalsWorkerInput);
  }, [reportViewAttributionFilters, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'reportViewAttributionSelectedLicense',
      data: reportViewSelectedLicense,
    } satisfies SignalsWorkerInput);
  }, [reportViewSelectedLicense, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'attributionSearch',
      data: debouncedAttributionSearch,
    } satisfies SignalsWorkerInput);
  }, [debouncedAttributionSearch, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'signalSorting',
      data: signalSorting,
    } satisfies SignalsWorkerInput);
  }, [signalSorting, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'areHiddenSignalsVisible',
      data: areHiddenSignalsVisible,
    } satisfies SignalsWorkerInput);
  }, [areHiddenSignalsVisible, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'signalFilters',
      data: signalFilters,
    } satisfies SignalsWorkerInput);
  }, [signalFilters, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'signalSearch',
      data: debouncedSignalSearch,
    } satisfies SignalsWorkerInput);
  }, [debouncedSignalSearch, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'attributionSelectedLicense',
      data: attributionSelectedLicense,
    } satisfies SignalsWorkerInput);
  }, [worker, attributionSelectedLicense]);

  useEffect(() => {
    worker?.postMessage({
      name: 'signalSelectedLicense',
      data: signalSelectedLicense,
    } satisfies SignalsWorkerInput);
  }, [worker, signalSelectedLicense]);
}
