// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import { flushSync } from 'react-dom';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { ProcessingStateUpdatedEvent } from '../../shared/shared-types';
import {
  ProcessingStateChangedListener,
  useIpcRenderer,
} from './use-ipc-renderer';

interface ProcessingStatusUpdatedResult {
  processingStatusUpdatedEvents: Array<ProcessingStateUpdatedEvent>;
  resetProcessingStatusEvents: () => void;
  processing: boolean;
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
      if (processingStateChangedEvent.type === 'ProcessingStateUpdated') {
        // eslint-disable-next-line @eslint-react/dom/no-flush-sync
        flushSync(() =>
          setProcessingStatusUpdatedEvents((processingStateChangedEvents) => {
            return [
              ...processingStateChangedEvents,
              processingStateChangedEvent,
            ];
          }),
        );
      } else if (processingStateChangedEvent.type === 'ProcessingStarted') {
        setProcessing(true);
        resetProcessingStatusEvents();
      } else if (processingStateChangedEvent.type === 'ProcessingDone') {
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
      if (processingStateChangedEvent.type === 'ProcessingStateUpdated') {
        const { level, date, message } = processingStateChangedEvent;
        console[level](`${dayjs(date).format('HH:mm:ss.SSS')} ${message}`);
      }
    },
    [],
  );
}
