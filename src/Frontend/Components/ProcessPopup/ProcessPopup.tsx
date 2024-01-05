// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import MuiDialog from '@mui/material/Dialog';
import MuiDialogContent from '@mui/material/DialogContent';
import MuiDialogTitle from '@mui/material/DialogTitle';
import { SvgIconProps } from '@mui/material/SvgIcon';
import MuiTypography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { useState } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { Log } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { baseIcon } from '../../shared-styles';
import {
  IsLoadingListener,
  LoggingListener,
  useIpcRenderer,
} from '../../util/use-ipc-renderer';
import { Spinner } from '../Spinner/Spinner';
import {
  BreakableTypography,
  MessageContainer,
  MetaContainer,
} from './ProcessPopup.style';

const icon: Record<
  Log['level'],
  { Component: React.FC<SvgIconProps>; color: string }
> = {
  error: { Component: ErrorIcon, color: 'red' },
  warn: { Component: WarningIcon, color: 'orange' },
  info: { Component: CheckIcon, color: 'green' },
};

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
    return logs.length ? (
      <MuiDialogContent>
        {logs.map(({ date, level, message }, index) => (
          <MessageContainer key={index} data-testid={`message-${index + 1}`}>
            <MetaContainer>
              {renderIcon(index, level)}
              <MuiTypography color={'darkblue'}>
                {dayjs(date).format('HH:mm:ss.SSS')}
              </MuiTypography>
              <MuiTypography>{'•'}</MuiTypography>
            </MetaContainer>
            <BreakableTypography>{message}</BreakableTypography>
          </MessageContainer>
        ))}
      </MuiDialogContent>
    ) : null;
  }

  function renderIcon(index: number, level: Log['level']) {
    const { color, Component } = icon[level];
    return index === logs.length - 1 ? (
      <Spinner size={15} />
    ) : (
      <Component sx={{ ...baseIcon, color }} />
    );
  }
}
