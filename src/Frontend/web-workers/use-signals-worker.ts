// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';

import { SignalWithCount } from '../../shared/shared-types';
import { useAppSelector } from '../state/hooks';
import {
  getExternalAttributionSources,
  getExternalData,
  getManualData,
  getProjectMetadata,
} from '../state/selectors/all-views-resource-selectors';
import {
  getResolvedExternalAttributions,
  getSelectedResourceId,
} from '../state/selectors/audit-view-resource-selectors';
import { isAuditViewSelected } from '../state/selectors/view-selector';
import { useVariable } from '../util/use-variable';
import { SignalsWorkerInput, SignalsWorkerOutput } from './signals-worker';

const REDUX_KEY_AUTOCOMPLETE_SIGNALS = 'autocomplete-signals';

export function useAutocompleteSignals() {
  const [autocompleteSignals] = useVariable<Array<SignalWithCount>>(
    REDUX_KEY_AUTOCOMPLETE_SIGNALS,
    [],
  );

  return autocompleteSignals;
}

export function useSignalsWorker() {
  const resourceId = useAppSelector(getSelectedResourceId);
  const externalData = useAppSelector(getExternalData);
  const manualData = useAppSelector(getManualData);
  const sources = useAppSelector(getExternalAttributionSources);
  const resolvedExternalAttributions = useAppSelector(
    getResolvedExternalAttributions,
  );
  const isAuditView = useAppSelector(isAuditViewSelected);
  const { projectId } = useAppSelector(getProjectMetadata);

  const [worker, setWorker] = useState<Worker>();
  const [_, setAutocompleteSignals] = useVariable<Array<SignalWithCount>>(
    REDUX_KEY_AUTOCOMPLETE_SIGNALS,
    [],
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
        setAutocompleteSignals(data.data);
      };
    }
  }, [setAutocompleteSignals, worker]);

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
    if (isAuditView && resourceId) {
      worker?.postMessage({
        name: 'resourceId',
        data: resourceId,
      } satisfies SignalsWorkerInput);
    }
  }, [isAuditView, resourceId, worker]);
}
