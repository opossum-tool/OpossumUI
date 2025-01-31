// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDialog from '@mui/material/Dialog';
import MuiDialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { Log } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import {
  IsLoadingListener,
  LoggingListener,
  useIpcRenderer,
} from '../../util/use-ipc-renderer';
import { LogDisplay } from '../LogDisplay/LogDisplay';
import { DialogContent } from './ProcessPopup.style';

export function ProcessPopup() {
  const [logs, setLogs] = useState<Array<Log>>([]);
  const [loading, setLoading] = useState(false);

  useIpcRenderer<LoggingListener>(
    AllowedFrontendChannels.Logging,
    (_, log) => setLogs((prev) => [...prev, log]),
    [],
  );

  useIpcRenderer<IsLoadingListener>(
    AllowedFrontendChannels.FileLoading,
    (_, { isLoading }) => {
      setLoading(isLoading);

      // reset component state
      if (isLoading) {
        setLogs([]);
      }
    },
    [],
  );

  return (
    <MuiDialog open={loading} fullWidth>
      <MuiDialogTitle>{text.processPopup.title}</MuiDialogTitle>
      {renderDialogContent()}
    </MuiDialog>
  );

  function renderDialogContent() {
    return (
      <DialogContent>
        {logs.map((log, index) => (
          <LogDisplay
            key={index}
            log={log}
            isActive={index === logs.length - 1}
            showDate={true}
          />
        ))}
      </DialogContent>
    );
  }
}
