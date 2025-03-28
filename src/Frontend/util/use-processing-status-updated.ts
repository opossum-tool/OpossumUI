// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import {
  ProcessingDoneEvent,
  ProcessingStartedEvent,
  ProcessingStateChangedEvent,
  ProcessingStateUpdatedEvent,
} from '../../shared/shared-types';
import {
  ProcessingStateChangedListener,
  useIpcRenderer,
} from './use-ipc-renderer';

export interface ProcessingStatusUpdatedResult {
  processingStatusUpdatedEvents: Array<ProcessingStateUpdatedEvent>;
  resetProcessingStatusEvents: () => void;
  processing: boolean;
}

function isProcessingStateUpdate(
  processingStateChangedEvent: ProcessingStateChangedEvent,
): processingStateChangedEvent is ProcessingStateUpdatedEvent {
  return processingStateChangedEvent.type === 'ProcessingStateUpdated';
}

function isProcessingStarted(
  processingStateChangedEvent: ProcessingStateChangedEvent,
): processingStateChangedEvent is ProcessingStartedEvent {
  return processingStateChangedEvent.type === 'ProcessingStarted';
}

function isProcessingDone(
  processingStateChangedEvent: ProcessingStateChangedEvent,
): processingStateChangedEvent is ProcessingDoneEvent {
  return processingStateChangedEvent.type === 'ProcessingDone';
}

export function useProcessingStatusUpdated(): ProcessingStatusUpdatedResult {
  const [processingStatusUpdatedEvents, setProcessingStatusUpdatedEvents] =
    useState<Array<ProcessingStateUpdatedEvent>>([]);
  const [processing, setProcessing] = useState<boolean>(false);

  const resetProcessingStatusEvents = useCallback(() => {
    setProcessingStatusUpdatedEvents([]);
  }, [setProcessingStatusUpdatedEvents]);

  useIpcRenderer<ProcessingStateChangedListener>(
    AllowedFrontendChannels.ProcessingStateChanged,
    (_, processingStateChangedEvent) => {
      if (isProcessingStateUpdate(processingStateChangedEvent)) {
        flushSync(() =>
          setProcessingStatusUpdatedEvents((processingStateChangedEvents) => {
            return [
              ...processingStateChangedEvents,
              processingStateChangedEvent,
            ];
          }),
        );
      } else if (isProcessingStarted(processingStateChangedEvent)) {
        setProcessing(true);
        resetProcessingStatusEvents();
      } else if (isProcessingDone(processingStateChangedEvent)) {
        setProcessing(false);
      }
    },
    [],
  );
  return {
    processingStatusUpdatedEvents,
    resetProcessingStatusEvents,
    processing,
  };
}

export function useSyncProcessingStatusUpdatesToFrontendLogs() {
  useIpcRenderer<ProcessingStateChangedListener>(
    AllowedFrontendChannels.ProcessingStateChanged,
    (_, processingStateChangedEvent) => {
      if (isProcessingStateUpdate(processingStateChangedEvent)) {
        const { level, date, message } = processingStateChangedEvent;
        console[level](`${dayjs(date).format('HH:mm:ss.SSS')} ${message}`);
      }
    },
    [],
  );
}
