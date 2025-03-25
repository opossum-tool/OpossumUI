// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useCallback, useState } from 'react';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { DataLoadEvent } from '../../shared/shared-types';
import { DataLoadEventListener, useIpcRenderer } from './use-ipc-renderer';

export function useDataLoadEvents(): [Array<DataLoadEvent>, () => void] {
  const [dataLoadEvents, setDataLoadEvents] = useState<Array<DataLoadEvent>>(
    [],
  );

  const reset = useCallback(() => {
    setDataLoadEvents([]);
  }, [setDataLoadEvents]);

  useIpcRenderer(
    AllowedFrontendChannels.ResetLoadedFile,
    () => setDataLoadEvents([]),
    [],
  );

  useIpcRenderer<DataLoadEventListener>(
    AllowedFrontendChannels.DataLoadEvent,
    (_, loadEvent) => {
      setDataLoadEvents((dataLoadEvents) => [...dataLoadEvents, loadEvent]);
    },
    [],
  );
  return [dataLoadEvents, reset];
}
