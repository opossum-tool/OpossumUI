// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';

import { SignalWithCount } from '../../shared/shared-types';
import { useAppSelector } from '../state/hooks';
import {
  getExternalAttributionSources,
  getExternalAttributionsToHashes,
  getExternalData,
  getManualData,
  getProjectMetadata,
} from '../state/selectors/all-views-resource-selectors';
import {
  getResolvedExternalAttributions,
  getSelectedResourceId,
} from '../state/selectors/audit-view-resource-selectors';
import { isAuditViewSelected } from '../state/selectors/view-selector';
import { PanelData } from '../types/types';
import { shouldNotBeCalled } from '../util/should-not-be-called';
import { useVariable } from '../util/use-variable';
import { SignalsWorkerInput, SignalsWorkerOutput } from './signals-worker';

const REDUX_KEY_AUTOCOMPLETE_SIGNALS = 'autocomplete-signals';
const REDUX_KEY_PANEL_DATA = 'panel-data';

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
  const [autocompleteSignals] = useVariable<Array<SignalWithCount>>(
    REDUX_KEY_AUTOCOMPLETE_SIGNALS,
    [],
  );

  return autocompleteSignals;
}

export function usePanelData() {
  const [panelData] = useVariable<WorkerPanelData>(
    REDUX_KEY_PANEL_DATA,
    initialWorkerPanelData,
  );

  return panelData;
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
  const isAuditView = useAppSelector(isAuditViewSelected);
  const { projectId } = useAppSelector(getProjectMetadata);

  const [worker, setWorker] = useState<Worker>();
  const [_, setAutocompleteSignals] = useVariable<Array<SignalWithCount>>(
    REDUX_KEY_AUTOCOMPLETE_SIGNALS,
    [],
  );
  const [, setPanelData] = useVariable<WorkerPanelData>(
    REDUX_KEY_PANEL_DATA,
    initialWorkerPanelData,
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
          default:
            shouldNotBeCalled(data);
        }
      };
    }
  }, [setAutocompleteSignals, setPanelData, worker]);

  useEffect(() => {
    worker?.postMessage({
      name: 'externalData',
      data: externalData,
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
      name: 'attributionsToHashes',
      data: attributionsToHashes,
    } satisfies SignalsWorkerInput);
  }, [attributionsToHashes, worker]);

  useEffect(() => {
    if (isAuditView && resourceId) {
      worker?.postMessage({
        name: 'resourceId',
        data: resourceId,
      } satisfies SignalsWorkerInput);
    }
  }, [isAuditView, resourceId, worker]);
}
