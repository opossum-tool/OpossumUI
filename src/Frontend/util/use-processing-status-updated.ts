// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useState } from 'react';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { ProcessingStateUpdatedEvent } from '../../shared/shared-types';
import {
  ProcessingStateChangedListener,
  useIpcRenderer,
} from './use-ipc-renderer';

export function useProcessingStatusUpdated(): [
  Array<ProcessingStateUpdatedEvent>,
  () => void,
] {
  const [processingStatusUpdatedEvents, setProcessingStatusUpdatedEvents] =
    useState<Array<ProcessingStateUpdatedEvent>>([]);

  const reset = useCallback(() => {
    setProcessingStatusUpdatedEvents([]);
  }, [setProcessingStatusUpdatedEvents]);

  useIpcRenderer(
    AllowedFrontendChannels.ResetLoadedFile,
    () => setProcessingStatusUpdatedEvents([]),
    [],
  );

  useIpcRenderer<ProcessingStateChangedListener>(
    AllowedFrontendChannels.ProcessingStateChanged,
    (_, processingStateChangedEvent) => {
      setProcessingStatusUpdatedEvents((processingStateChangedEvents) => [
        ...processingStateChangedEvents,
        processingStateChangedEvent,
      ]);
    },
    [],
  );
  return [processingStatusUpdatedEvents, reset];
}
