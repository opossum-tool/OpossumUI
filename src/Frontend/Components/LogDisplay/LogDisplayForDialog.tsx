// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { useState } from 'react';

import { Log } from '../../../shared/shared-types';
import { useStateEffect } from '../../state/hooks';
import { getLogMessage } from '../../state/selectors/view-selector';
import { LogDisplay } from './LogDisplay';

interface LogDisplayForDialogProps {
  isLoading: boolean;
}

export function LogDisplayForDialog({ isLoading }: LogDisplayForDialogProps) {
  const [logToDisplay, setLogToDisplay] = useState<Log | null>(null);

  useStateEffect(
    getLogMessage,
    (log) => {
      if (isLoading) {
        setLogToDisplay(log);
      }
    },
    [isLoading],
  );

  return logToDisplay ? (
    <MuiBox
      sx={{
        display: 'flex',
        columnGap: '4px',
        marginLeft: '10px',
        flexGrow: 1,
      }}
    >
      <LogDisplay
        log={logToDisplay}
        isInProgress={isLoading}
        showDate={false}
        useEllipsis={true}
      />
    </MuiBox>
  ) : undefined;
}
