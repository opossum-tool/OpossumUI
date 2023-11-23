// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  SvgIconProps,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import React, { useState } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { Log } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { baseIcon } from '../../shared-styles';
import {
  IsLoadingListener,
  LoggingListener,
  useIpcRenderer,
} from '../../util/use-ipc-renderer';
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

export function ProcessPopup(): React.ReactNode {
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
    <Dialog open={loading} fullWidth>
      <DialogTitle>{text.processPopup.title}</DialogTitle>
      {renderDialogContent()}
    </Dialog>
  );

  function renderDialogContent(): React.ReactNode {
    return logs.length ? (
      <DialogContent>
        {logs.map(({ date, level, message }, index) => (
          <MessageContainer key={index} data-testid={`message-${index + 1}`}>
            <MetaContainer>
              {renderIcon(index, level)}
              <Typography color={'darkblue'}>
                {dayjs(date).format('HH:mm:ss.SSS')}
              </Typography>
              <Typography>{'•'}</Typography>
            </MetaContainer>
            <BreakableTypography>{message}</BreakableTypography>
          </MessageContainer>
        ))}
      </DialogContent>
    ) : null;
  }

  function renderIcon(index: number, level: Log['level']): React.ReactNode {
    const { color, Component } = icon[level];
    return index === logs.length - 1 ? (
      <CircularProgress
        disableShrink
        size={15}
        sx={baseIcon}
        data-testid={'spinner'}
      />
    ) : (
      <Component sx={{ ...baseIcon, color }} />
    );
  }
}
