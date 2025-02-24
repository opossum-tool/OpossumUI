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
import { useAppSelector } from '../../state/hooks';
import { getOpenPopup } from '../../state/selectors/view-selector';
import {
  IsLoadingListener,
  LoggingListener,
  useIpcRenderer,
} from '../../util/use-ipc-renderer';
import { LogDisplay } from '../LogDisplay/LogDisplay';
import { DialogContent } from './ProcessPopup.style';

export function ProcessPopup() {
  const [logs, setLogs] = useState<Array<Log>>([]);

  const [isLoading, setIsLoading] = useState(false);
  const isOtherPopupOpen = !!useAppSelector(getOpenPopup);

  useIpcRenderer<IsLoadingListener>(
    AllowedFrontendChannels.FileLoading,
    (_, { isLoading }) => {
      setIsLoading(isLoading);
      if (isLoading) {
        setLogs([]);
      }
    },
    [],
  );

  useIpcRenderer<LoggingListener>(
    AllowedFrontendChannels.Logging,
    (_, log) => {
      if (log) {
        setLogs((prev) => [...prev, log]);
      }
    },
    [],
  );

  return (
    <MuiDialog open={isLoading && !isOtherPopupOpen} fullWidth>
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
            isInProgress={index === logs.length - 1}
            showDate={true}
          />
        ))}
      </DialogContent>
    );
  }
}
