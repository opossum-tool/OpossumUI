// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDialog from '@mui/material/Dialog';
import MuiDialogTitle from '@mui/material/DialogTitle';
import { useEffect, useState } from 'react';

import { Log } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { useAppSelector } from '../../state/hooks';
import { getLogMessage, isLoading } from '../../state/selectors/view-selector';
import { LogDisplay } from '../LogDisplay/LogDisplay';
import { DialogContent } from './ProcessPopup.style';

export function ProcessPopup() {
  const [logs, setLogs] = useState<Array<Log>>([]);
  const loading = useAppSelector(isLoading);
  const newestLogMessage = useAppSelector(getLogMessage);

  useEffect(() => {
    if (loading) {
      setLogs([]);
    }
  }, [loading]);

  useEffect(() => {
    if (newestLogMessage) {
      setLogs((prev) => [...prev, newestLogMessage]);
    }
  }, [newestLogMessage]);

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
            isInProgress={index === logs.length - 1}
            showDate={true}
          />
        ))}
      </DialogContent>
    );
  }
}
